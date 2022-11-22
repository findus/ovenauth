use std::future::Future;
use actix_web::{HttpResponse, Responder, web};
use reqwest::header::AUTHORIZATION;
use serde_json::json;
use crate::{join_all, PgPool, StreamViewerAuthentication, User};
use serde::{Deserialize, Serialize};
use actix_web::get;
use dotenv::dotenv;
use std::{env};
use std::fmt::format;
use actix_identity::Identity;
use futures::FutureExt;
use log::error;

lazy_static! {
    static ref OVE_URL: String = env::var("OVE_URL").expect("OVE_URL is not set");
    static ref OVE_REST_PORT: String = env::var("OVE_REST_PORT").expect("OVE_REST_PORT is not set");
    static ref OVE_THUMB_PORT: String = env::var("OVE_THUMB_PORT").expect("OVE_THUMB_PORT is not set");
}

#[derive(Serialize,Deserialize,Debug)]
struct OveStreamStats {
    message: String,
    response: OveStreamStatResponse
}

#[derive(Serialize,Deserialize,Debug)]
struct OveStreamStatResponse {
    createdTime: String,
    lastRecvTime: String,
    lastSentTime: String,
    lastUpdatedTime: String,
    maxTotalConnectionTime: String,
    maxTotalConnections: u8,
    totalBytesIn: u32,
    totalBytesOut: u32,
    totalConnections: u32
}

#[derive(Serialize,Deserialize,Debug)]
struct OveStreamRecordings {
    message: String,
    response: Vec<Recording>
}

#[derive(Debug, Deserialize, Serialize)]
struct Recording {
    app: String,
    createdTime: String,
    finishTime: Option<String>,
    id: String,
    outputFilePath: Option<String>,
    outputInfoPath: Option<String>,
    schedule: String,
    segmentationRule: String,
    sequence: Option<u32>,
    startTime: Option<String>,
    state: String,
    stream: Stream,
    totalRecordBytes: Option<u32>,
    totalRecordTime: Option<u32>,
    vhost: String,
}

#[derive(Debug, Deserialize, Serialize)]
struct Stream {
    name: String,
    tracks: Vec<String>,
}

#[derive(Serialize,Deserialize,Debug)]
struct StatResult {
    name: String,
    stats: OveStreamStats,
    thumb: String
}

fn get_request(url: String) -> impl Future<Output = Result<reqwest::Response, reqwest::Error>> {
    let client = reqwest::Client::new();
    client
        .get(url)
        .header(AUTHORIZATION, "Basic TWVlbXF4ZA==")
        .send()
}

fn post_request<T: Serialize + ?Sized>(url: String, body: &T) -> impl Future<Output = Result<reqwest::Response, reqwest::Error>> {
    let client = reqwest::Client::new();
    client.post(url)
        .json(body)
        .header(AUTHORIZATION, "Basic TWVlbXF4ZA==")
        .send()
}

#[derive(Deserialize)]
pub struct StreamName {
    stream: String,
}

#[get("/viewerCount")]
pub async fn viewCount(id: Identity, db: web::Data<PgPool>, web::Query(info): web::Query<StreamName>) -> HttpResponse {

    async fn get_stats(stream: &str) -> Result<HttpResponse, reqwest::Error> {
        let e: OveStreamStats = crate::ove::get_stats(stream).await?.json().await?;
        Ok(HttpResponse::Ok().json(json!(e)))
    }

    let id = id.identity().map(|id| id.parse::<i32>().unwrap());

    let streamer_id = User::from_username(&info.stream, &db).await.expect("Could not find user");
    let allowed = StreamViewerAuthentication::get_allowed_viewers(streamer_id.unwrap().id, &db).await.unwrap_or(Vec::new());

    if let Some(id) = id {
        if allowed.len() > 0 && allowed.iter().filter(|entry| entry.id.eq(&id)).count() == 0 {
            return HttpResponse::Unauthorized().json(json!({ "errors": ["You are not whitelisted"] }))
        } else {
            return get_stats(&info.stream).await.expect("get_stats failed");
        }
    } else if StreamViewerAuthentication::is_public(&info.stream, &db).await.is_err()  {
        return HttpResponse::Unauthorized().json(json!({ "errors": ["You are not whitelisted"] }))
    } else {
        return get_stats(&info.stream).await.expect("get_stats failed");
    }
}

fn get_stats(username: &str) -> impl Future<Output = Result<reqwest::Response, reqwest::Error>> {
    get_request(format!("http://{}:{}/v1/stats/current/vhosts/default/apps/app/streams/{}",*OVE_URL, *OVE_REST_PORT, username))
}

fn get_thumbs(username: &str) -> impl Future<Output = Result<reqwest::Response, reqwest::Error>> {
    get_request(format!("http://{}:{}/app/{}/thumb.jpg", *OVE_URL, *OVE_THUMB_PORT, username))
}

fn recording_post_request<T: Serialize + ?Sized>(action: &str, body: &T) -> impl Future<Output = Result<reqwest::Response, reqwest::Error>> {
    post_request(format!("http://{}:{}/v1/vhosts/default/apps/app:{}", *OVE_URL, *OVE_REST_PORT, action), body)
}

#[get("/stats")]
pub async fn stats(id: Identity, db: web::Data<PgPool>) -> impl Responder {

    let id = id.identity().map(|id| id.parse().unwrap());
    let streams = match id {
        Some(id) => StreamViewerAuthentication::get_viewable_streams_for_user(id, &db).await,
        None => StreamViewerAuthentication::get_all_public_streams(&db).await
    }.and_then(|streams| {
        let response = streams.into_iter().map(|stream| {
            let stats = get_stats(&stream.username);
            let thumb = get_thumbs(&stream.username);
            async {
                let thumb = base64::encode(thumb.await?.bytes().await?.to_vec());
                let stats = stats.await?.json().await?;
                Result::<StatResult, reqwest::Error>::Ok(StatResult { name: stream.username, stats, thumb })
            }
        }).collect::<Vec<_>>();
        Ok(response)
    }).unwrap();

    let ok_results = join_all(streams).await.into_iter().filter_map(|x| x.ok()).collect::<Vec<_>>();
    HttpResponse::Ok().json(json!(ok_results))
}

#[get("/startRecord")]
pub async fn startRecording(id: Identity, db: web::Data<PgPool>) -> HttpResponse {
    if let Some(id) = id.identity().map(|id| id.parse::<i32>().unwrap()) {
        let user = User::from_id(id, &db).await.expect("expected valid user");
        let request_json = json!({
                    "id": &user.username,
                    "stream": {
                        "name": &user.username,
                    },
                    "schedule" : "0 0 */1",
                    "segmentationRule" : "continuity"
                });
        return recording_post_request(&"startRecord", &request_json)
            .await
            .map(|e| HttpResponse::Ok().json(json!({ "recording" : "started"})))
            .unwrap_or(HttpResponse::InternalServerError().finish())
    }
    return HttpResponse::Unauthorized().json(json!({ "errors": ["Unauthorized"] }))
}

#[get("/stopRecord")]
pub async fn stopRecording(id: Identity, db: web::Data<PgPool>) -> HttpResponse {
    if let Some(id) = id.identity().map(|id| id.parse::<i32>().unwrap()) {
        let user = User::from_id(id, &db).await.expect("expected valid user");
        let request_json = json!({ "id" : &user.username });
        return recording_post_request(&"stopRecord", &request_json)
            .await
            .map(|e| HttpResponse::Ok().json(json!({ "recording" : "started"})))
            .unwrap_or(HttpResponse::InternalServerError().finish())
    }
    return HttpResponse::Unauthorized().json(json!({ "errors": ["Unauthorized"] }))
}

#[get("/recordStatus")]
pub async fn recordStatus(id: Identity, db: web::Data<PgPool>) -> HttpResponse {
    if let Some(id) = id.identity().map(|id| id.parse::<i32>().unwrap()) {
        let user = User::from_id(id, &db).await.expect("expected valid user");
        let request_json = json!({
                    "id": &user.username
                });
         if let Ok(result)  = recording_post_request(&"records", &request_json)
             .await.map(|e|  async { e.json::<OveStreamRecordings>().await }) {
             return result.await.map(|response| HttpResponse::Ok().json(response))
                 .unwrap_or_else(|error| {
                     error!("{:#?}", error);
                     return HttpResponse::InternalServerError().finish();
                 });
         }
    }
    return HttpResponse::Unauthorized().json(json!({ "errors": ["Unauthorized"] }))
}
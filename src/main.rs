#[macro_use]
extern crate futures;
extern crate core;
#[macro_use]
extern crate lazy_static;

use actix_cors::Cors;
use actix_identity::{CookieIdentityPolicy, Identity, IdentityService};
use actix_web::{body::BoxBody, middleware::Logger, post, get, web, App, HttpRequest, HttpResponse, HttpServer, Responder, HttpMessage, ResponseError};
use chrono::Utc;
use dotenv::dotenv;
use log::{error, info, Record, warn};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Pool, Postgres};
use std::{env};
use std::fmt::format;
use std::fs::File;
use std::future::Future;
use std::ops::Deref;
use actix_web::cookie::time::Duration;
use actix_web::dev::ResourcePath;
use actix_web::web::Data;
use futures::future::{join_all, try_join_all};
use futures::TryFutureExt;
use reqwest::header::AUTHORIZATION;
use serde_json::json;
use serde_json::ser::State::Empty;
use tokio::net::TcpStream;
use std::fmt::{Debug, Display, Formatter};
use actix_web_actors::ws;
use flexi_logger::DeferredNow;
use url::Url;
use crate::session::ChatSession;

mod user;
mod web_push;
mod ove;
mod websocket;
mod chatmessages;
mod session;

use crate::user::{StreamOption, StreamViewerAuthentication, User};

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    client: Client,
    request: Request,
}

#[derive(Debug, Serialize, Deserialize)]
struct Client {
    address: String,
    port: u16,
}

#[derive(Debug, Serialize, Deserialize)]
struct Request {
    direction: Direction,
    protocol: Protocol,
    url: String,
    time: chrono::DateTime<Utc>,
    status: String
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
enum Direction {
    Incoming,
    Outgoing,
}

#[derive(Debug, Serialize, Deserialize)]
enum Protocol {
    #[serde(rename = "WebRTC")]
    WebRTC,
    #[serde(rename = "RTMP")]
    Rtmp,
    #[serde(rename = "SRT")]
    Srt,
    #[serde(rename = "HLS")]
    Hls,
    #[serde(rename = "DASH")]
    Dash,
    #[serde(rename = "LLDASH")]
    LLDash,
}

#[derive(Debug, Serialize, Deserialize, Default)]
struct Response {
    allowed: bool,
    new_url: Option<String>,
    lifetime: Option<u64>,
    reason: Option<String>,
}

impl Response {
    fn new(
        allowed: bool,
        new_url: Option<String>,
        lifetime: Option<u64>,
        reason: Option<String>,
    ) -> Self {
        Self {
            allowed,
            new_url,
            lifetime,
            reason,
        }
    }

    fn allowed() -> Self {
        Self::new(true, None, None, None)
    }

    fn redirect(new_url: String) -> Self {
        Self::new(true, Some(new_url), None, None)
    }

    fn denied(reason: String) -> Self {
        Self::new(false, None, None, Some(reason))
    }
}

impl Responder for Response {
    type Body = BoxBody;
    fn respond_to(self, _req: &HttpRequest) -> HttpResponse<Self::Body> {
        HttpResponse::Ok().json(&self)
    }
}

// TODO: verify X-OME-Signature
#[post("/webhook")]
async fn webhook(body: web::Json<Config>, db: web::Data<PgPool>) -> Response {

    if let Direction::Outgoing = body.request.direction {
        // TODO Implement correct redirects
        return Response::allowed();
    }
    let mut url = match Url::parse(&body.request.url) {
        Ok(url) => url,
        Err(e) => {
            error!("{}", e);
            return Response::denied(format!("{}", e));
        }
    };

    let creds: Option<Vec<&str>> = url.path_segments().map(|s| s.collect());

    if creds.is_none() {
        return Response::denied("Invalid URL".to_string());
    }

    let creds = creds.unwrap();

    if creds.len() != 2 || creds[0] != "app" {
        return Response::denied("Unknown Application".to_string());
    }

    let token = creds[1];

    let user = match StreamOption::get_user_from_token(token, &db).await {
        Ok(user) => user,
        Err(e) => {
            error!("{}", e);
            return Response::denied(format!("{}", e));
        }
    };
    url.set_path(&format!("app/{}", user.username.clone()));
    if body.request.status.eq("opening") {
        let msg = &format!("Stream starting: {} {}", user.username, if user.public { "WARNING PUBLIC STREAM" } else { "" }).to_string();
        web_push::web_push(db, "Stream starting".to_string(), format!("Looks like {} is online", user.username)).await;
        send_message(msg);
    } else {
        let msg = &format!("Stream ending: {} {}", user.username, if user.public { "WARNING PUBLIC STREAM" } else { "" }).to_string();
        web_push::web_push(db, "Stream ending".to_string(), format!("Looks like {} is offline", user.username)).await;
        send_message(msg);
    }
    Response::redirect(url.to_string())
}

#[derive(Debug)]
struct NotLoggedIn {

}

impl Display for NotLoggedIn {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "tja")
    }
}

impl ResponseError for NotLoggedIn {

}

async fn chat_ws(id: Identity, db: web::Data<PgPool>, req: HttpRequest, stream: web::Payload) -> Result<impl Responder, actix_web::Error> {

    let user_result = match id.identity() {
        Some(id) => {
            let id = id.parse::<i32>().unwrap();
            User::from_id(id, &db).await.map(|user| user.username)
        },
        None => { Ok("Guest".to_owned()) }
    };

    match user_result {
        Ok(user) => {
            return ws::start(ChatSession {
                id: gen_username(&user),
                room: "fluss".to_string(),
                name: Some(user.clone())
            }, &req, stream)
        },
        Err(e) => {
            error!("{}", e);
            return Err(actix_web::Error::from(NotLoggedIn {}))
        }
    }

    fn gen_username(user: &str) -> String {
        format!("{}_{}",rand::random::<usize>(), user)
    }

}

pub fn default_format(
    w: &mut dyn std::io::Write,
    _now: &mut DeferredNow,
    record: &Record,
) -> core::result::Result<(), std::io::Error> {
    write!(
        w,
        "{}",
        record.args()
    )
}

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();
    flexi_logger::Logger::try_with_env_or_str("info, sqlx=error").unwrap().log_to_stdout().format(default_format).start().unwrap();

    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL is not set");
    let host = env::var("HOST").expect("HOST is not set");
    let port = env::var("PORT").expect("PORT is not set");

    let db_pool = PgPool::connect(&db_url).await?;

    sqlx::migrate!("./migrations").run(&db_pool).await?;

    let secret: [u8; 32] = rand::thread_rng().gen();

    info!("Starting server on {}:{}", host, port);
    send_message("oi m8, ye sörver is stoarding ubb m9");
    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .wrap(Cors::permissive())
            .wrap(IdentityService::new(
                CookieIdentityPolicy::new(&secret).name("auth").secure(true).max_age(Duration::days(90)),
            ))
            .app_data(web::Data::new(db_pool.clone()))
            .service(web::resource("/ws").to(chat_ws))
            .service(webhook)
            .service(user::login)
            .service(user::logout)
            .service(user::register)
            .service(user::index)
            .service(user::me)
            .service(user::options)
            .service(user::reset)
            .service(user::submit_token)
            .service(user::generate_token)
            .service(user::get_allowed_viewers)
            .service(user::set_viewer_permission)
            .service(user::allowed_to_watch)
            .service(user::submit_header_token)
            .service(user::set_public)
            .service(web_push::web_push_subscribe)
            .service(ove::stats)
            .service(ove::viewCount)
            .service(ove::recordStatus)
            .service(ove::startRecording)
            .service(ove::stopRecording)
    })
    .bind(format!("{}:{}", host, port))?
    .run()
    .await?;

    Ok(())
}

fn send_message(message: &str) {
    if let (Ok(token),Ok(chat_id)) = (env::var("TELEGRAM_BOT_TOKEN"), env::var("TELEGRAM_CHAT_ID").and_then(|e| e.parse::<i64>().map_err(|_| env::VarError::NotPresent))) {
        telegram_notifyrs::send_message(message.to_string(), &token, chat_id);
    }
}

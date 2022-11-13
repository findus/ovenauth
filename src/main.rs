use actix_cors::Cors;
use actix_identity::{CookieIdentityPolicy, IdentityService};
use actix_web::{
    body::BoxBody, middleware::Logger, post, web, App, HttpRequest, HttpResponse, HttpServer,
    Responder,
};
use chrono::Utc;
use dotenv::dotenv;
use env_logger::Env;
use log::{error, info, log};
use rand::Rng;
use serde::{Deserialize, Serialize};
use sqlx::{PgPool, Pool, Postgres};
use std::env;
use std::fs::File;
use actix_web::cookie::time::Duration;
use actix_web::web::Data;
use serde_json::json;
use url::Url;
use web_push::{ContentEncoding, SubscriptionInfo, VapidSignatureBuilder, WebPushClient, WebPushMessageBuilder};

mod user;

use crate::user::StreamOption;

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

#[derive(Debug, Deserialize, Serialize)]
struct Keys {
    auth: String,
    p256dh: String
}

#[derive(Debug, Deserialize, Serialize)]
struct WebPush {
    endpoint: String,
    expirationTime: Option<String>,
    keys: Keys
}

#[post("/subscribe")]
async fn web_push_subscribe(body: web::Json<WebPush>, db: web::Data<PgPool>) -> impl Responder {
    let db_string = serde_json::to_string(&body).unwrap();
    let query = sqlx::query!(
            "insert into webpushentries (json) values ($1) on conflict do nothing",
            &db_string
        );

    match query.execute(&**db).await {
        Ok(_) => HttpResponse::Ok().json(json!({})),
        Err(e) => {
            error!("{}", e);
            return HttpResponse::InternalServerError().finish();
        }
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
    let msg = &format!("Stream starting or ending: {} {}", user.username, if user.public { "WARNING PUBLIC STREAM" } else { "" }).to_string();
    send_message(msg);
    web_push(&db, &msg).await;
    Response::redirect(url.to_string())
}

#[actix_web::main]
async fn main() -> anyhow::Result<()> {
    dotenv().ok();

    let db_url = env::var("DATABASE_URL").expect("DATABASE_URL is not set");
    let host = env::var("HOST").expect("HOST is not set");
    let port = env::var("PORT").expect("PORT is not set");

    env_logger::Builder::from_env(Env::default().default_filter_or("info")).init();

    let db_pool = PgPool::connect(&db_url).await?;
    web_push(&db_pool, "Start").await;

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
            .service(web_push_subscribe)
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

#[derive(Debug, Deserialize, Serialize)]
struct WebToken {
    json: String
}

async fn web_push(db: &Pool<Postgres>, message: &str) -> () {
    let  tokens = sqlx::query_as!(WebToken, "select json from webpushentries")
        .fetch_all(db)
        .await
        .unwrap()
        .iter()
        .map(|entry| serde_json::from_str(&entry.json).unwrap())
        .collect::<Vec<SubscriptionInfo>>();

    println!("{} tokens", tokens.len());

    for entry in tokens.iter() {

        //You would likely get this by deserializing a browser `pushSubscription` object.
        let subscription_info = entry;
        info!("Sending web-push to: {:#?}", subscription_info);

        let ece_scheme = ContentEncoding::Aes128Gcm;

        let mut builder = WebPushMessageBuilder::new(&subscription_info).unwrap();

        builder.set_payload(ece_scheme, message.as_bytes());


        let file = File::open("private_key.pem").unwrap();

        let mut sig_builder = VapidSignatureBuilder::from_pem(file, &subscription_info).unwrap();

        sig_builder.add_claim("sub", "mailto:test@example.com");
        sig_builder.add_claim("foo", "bar");
        sig_builder.add_claim("omg", 123);

        let signature = sig_builder.build().unwrap();

        builder.set_vapid_signature(signature);
        let message = format!("{{ \"title\": \"{}\" }}", message);
        builder.set_payload(ContentEncoding::Aes128Gcm, message.as_bytes());


        let client = WebPushClient::new().unwrap();

        let response = client.send(builder.build().unwrap()).await;
        if response.is_err() {
            let e = entry.endpoint.to_string();
            info!("{}", e);
            sqlx::query!("delete from webpushentries where json like $1;", format!("%{}%", e)).execute(db).await.unwrap();
        }

        println!("Sent: {:?}", response.is_ok());
    }

    ()
}

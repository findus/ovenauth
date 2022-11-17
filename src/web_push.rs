use std::fs::File;
use actix_web::web::Data;
use log::warn;
use sqlx::{Pool, Postgres};
use web_push::{ContentEncoding, SubscriptionInfo, VapidSignatureBuilder, WebPushClient, WebPushMessageBuilder};
use serde::{Deserialize, Serialize};
use web_push::WebPushError::*;

#[derive(Debug, Deserialize, Serialize)]
struct WebToken {
    json: String
}

pub async fn web_push(db: Data<Pool<Postgres>>, title: String, message: String) -> () {
    let tokens = sqlx::query_as!(WebToken, "select json from webpushentries")
        .fetch_all(&**db)
        .await
        .unwrap()
        .iter()
        .map(|entry| serde_json::from_str(&entry.json).unwrap())
        .collect::<Vec<SubscriptionInfo>>();

    println!("Sending {} webpush messages", tokens.len());

    for subscription_info in tokens.into_iter() {


        let db2 = db.clone();
        let entry2 = subscription_info.clone();
        let title = title.clone();
        let message = message.clone();

        tokio::task::spawn( async move {

            let mut builder = WebPushMessageBuilder::new(&subscription_info).unwrap();

            let file = File::open("private_key.pem").unwrap();

            let mut sig_builder = VapidSignatureBuilder::from_pem(file, &subscription_info).unwrap();

            sig_builder.add_claim("sub", "mailto:push@f1ndus.de");

            let signature = sig_builder.build().unwrap();

            builder.set_vapid_signature(signature);
            let message = format!("{{ \"title\": \"{}\", \"message\": \"{}\" }}", title.to_string(), message.to_string());
            builder.set_payload(ContentEncoding::Aes128Gcm, message.as_bytes());
            builder.set_ttl(7200);

            let client = WebPushClient::new().unwrap();
            let response = client.send(builder.build().unwrap()).await;
            let e = entry2.endpoint.to_string();
            match response {
                Ok(_) => println!("Sending Sucessfull"),
                Err(EndpointNotFound) | Err(EndpointNotValid) => {
                    warn!("Error sending token, gonna delete it from db");
                    sqlx::query!("delete from webpushentries where json like $1;", format!("%{}%", e)).execute(&**db2).await.unwrap();
                },
                Err(error) => println!("Error while sending web push token to {}: {}",e, error)
            };
        });

    }

    ()
}
use crate::{Config, LocalStarter, RemoteStarter};

pub fn r#use(_config: Config, starter_identifier: &String) {
    println!("Using {starter_identifier}");

    if starter_identifier.starts_with("@") {
        let starter = RemoteStarter::from_path(starter_identifier);
        println!("Found remote starter {:?}", starter);
    } else {
        let starter = LocalStarter::from_path(starter_identifier);
        println!("Found local starter {:?}", starter);
    }
}

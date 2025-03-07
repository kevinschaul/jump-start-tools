use crate::{starter::RemoteStarter, Config};

pub fn r#use(_config: Config, starter_identifier: &String) {
    println!("Using {starter_identifier}");

    let starter = RemoteStarter::from_path(starter_identifier);
    println!("Found starter {:?}", starter);
}

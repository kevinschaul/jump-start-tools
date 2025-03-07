use crate::{Config, LocalStarter, RemoteStarter, config::get_default_instance};

pub fn r#use(config: Config, starter_identifier: &String) {
    let instance = get_default_instance(&config);

    if starter_identifier.starts_with("@") {
        let starter = RemoteStarter::from_path(starter_identifier, Some(&instance.github_repo));
        println!("Found remote starter {:?}", starter);
    } else {
        let starter = LocalStarter::from_path(starter_identifier);
        println!("Found local starter {:?}", starter);
    }
}

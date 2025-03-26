use crate::Config;
use anyhow::Result;

pub fn find(_config: Config, search_term: &String) -> Result<()> {
    println!("Finding {search_term}");
    Ok(())
}

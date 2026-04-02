use std::fs;
use tauri::{AppHandle, Manager, WebviewWindow};

#[tauri::command]
fn save_run(app: AppHandle, run_json: String) -> Result<String, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let runs_dir = app_dir.join("runs");
    fs::create_dir_all(&runs_dir).map_err(|e| e.to_string())?;

    let run: serde_json::Value =
        serde_json::from_str(&run_json).map_err(|e| e.to_string())?;
    let id = run["id"].as_str().unwrap_or("run").to_string();
    let file_path = runs_dir.join(format!("{}.json", id));
    fs::write(&file_path, &run_json).map_err(|e| e.to_string())?;

    Ok(file_path.to_string_lossy().to_string())
}

#[tauri::command]
fn load_runs(app: AppHandle) -> Result<Vec<String>, String> {
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    let runs_dir = app_dir.join("runs");
    if !runs_dir.exists() {
        return Ok(vec![]);
    }

    let mut runs = Vec::new();
    let entries = fs::read_dir(&runs_dir).map_err(|e| e.to_string())?;
    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().map(|e| e == "json").unwrap_or(false) {
            if let Ok(content) = fs::read_to_string(&path) {
                runs.push(content);
            }
        }
    }
    Ok(runs)
}

#[tauri::command]
fn set_always_on_top(window: WebviewWindow, always_on_top: bool) -> Result<(), String> {
    window
        .set_always_on_top(always_on_top)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .invoke_handler(tauri::generate_handler![save_run, load_runs, set_always_on_top])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

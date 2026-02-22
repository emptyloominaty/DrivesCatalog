let settings = {
	open: false,
    openFoldersOnMouseOver: true,
	animations: false
}

let settingsWindow = document.getElementById("settings");
let toggleSettingsWindow = function() {
	if (settings.open) {
		settingsWindow.style.display = "none"
	} else {
	settingsWindow.style.display = "flex"
	}
	settings.open = !settings.open
}

let toggleSetting = function(name,el) {
	settings[name] = !settings[name]
    el.innerHTML = name+": "+getBoolString(settings[name])
}

let getBoolString = function(val) {
    if (val) {
        return "on"
    } 
    return "off"
}
//-----------------------------------------------------------------------
async function getDecompressedData(base64String) {
    const binaryString = atob(base64String)
    const bytes = Uint8Array.from(binaryString, c => c.charCodeAt(0))
    const stream = new Response(bytes).body.pipeThrough(new DecompressionStream("gzip"))
    const decompressedResponse = await new Response(stream).text()
    return JSON.parse(decompressedResponse)
}
//-----------------------------------------------------------------------
let output = document.getElementById("output");
let outputFolder = document.getElementById("outputFolder");
let outputSubfolder = document.getElementById("outputSubfolder");
let drivesList = document.getElementById("drivesList");
let lastBtn = false
let lastSubBtn = false
let lastDrive = false
//-----------------------------------------------------------------------
let openSubfolder = function(idx, name , subname, buttonEl, mouseOver = false) {
    if (!settings.openFoldersOnMouseOver && mouseOver) {
      	return
    }
	let oldCount = outputSubfolder.children.length;
    if (lastSubBtn !== false) {
      	lastSubBtn.textContent = lastSubBtn.textContent.slice(0, -7)
      	lastSubBtn.classList.remove("btnSelected")
    }
    buttonEl.textContent = subname+" =====>"
    buttonEl.classList.add("btnSelected")
    lastSubBtn = buttonEl

    let html = ""
    let folder = jsonData[idx].folders[name].folders[subname]

    for (const [key, value] of Object.entries(folder.folders)) {
      	html += `<button>${key}</button>`;
    }

    for (let i = 0; i<folder.files.length; i++) {
      	html += "<div>"+folder.files[i]+"</div>"
    }
    outputSubfolder.innerHTML = html

	animate(outputSubfolder, oldCount)
}
//-----------------------------------------------------------------------
let openFolder = function(idx, name, buttonEl, mouseOver = false) {
    if (!settings.openFoldersOnMouseOver && mouseOver) {
      	return
    }
	let oldCount = outputFolder.children.length;
    if (lastBtn !== false) {
      	lastBtn.textContent = lastBtn.textContent.slice(0, -7)
      	lastBtn.classList.remove("btnSelected")
    }
    buttonEl.textContent = name+" =====>"
    buttonEl.classList.add("btnSelected")
    lastBtn = buttonEl


    let html = ""
    let folder = jsonData[idx].folders[name]

    for (let i = 0; i<folder.folders.length; i++) {
      	html += "<button>"+folder.folders[i]+"</button>"
    }
    for (const [key, value] of Object.entries(jsonData[idx].folders[name].folders)) {
      	html += `<button onmouseenter="openSubfolder(${idx},'${name}', '${key}', this, true)" onclick="openSubfolder(${idx},'${name}', '${key}', this)">${key}</button>`;
    }

    for (let i = 0; i<folder.files.length; i++) {
      	html += "<div>"+folder.files[i]+"</div>"
    }

    outputFolder.innerHTML = html
	animate(outputFolder, oldCount)
    outputSubfolder.innerHTML = ""
}
//-----------------------------------------------------------------------
let selectDrive = function(idx, buttonEl) {
    let html = ""
	if (lastDrive !== false) {
		lastDrive.classList.remove("btnSelected")
	}
    buttonEl.classList.add("btnSelected")
  	lastDrive = buttonEl

    let oldCount = output.children.length;


    for (const [key, value] of Object.entries(jsonData[idx].folders)) {
      	html += `<button onmouseenter="openFolder(${idx}, '${key}', this, true)" onclick="openFolder(${idx}, '${key}', this)">${key}</button>`;
    }

    for (let i = 0; i<jsonData[idx].root_files.length; i++) {
      	html += "<div>"+jsonData[idx].root_files[i]+"</div>"
    }
    output.innerHTML = html
    outputFolder.innerHTML = ""
    outputSubfolder.innerHTML = ""
	animate(output, oldCount)
}
//-----------------------------------------------------------------------
let init = function() {
  	for (let i = 0; i < jsonData.length; i++) {
    	let drive = jsonData[i]
    	let btn = document.createElement("button")

    	if (drive.label!=="") {
      		btn.textContent = "("+drive.label+") "+drive.drive
    	} else {
      		btn.textContent = drive.drive
    	}

    
    	btn.onclick = () => selectDrive(i, btn)
    	drivesList.appendChild(btn);
  	}
}
//-----------------------------------------------------------------------
if (compressed) {
    getDecompressedData(compressedData).then(data => {
      	jsonData = data
      	init()
    })
} else {
    init()
}

let animate = function(element,oldCount) {
	if (!settings.animations) {
		return
	}
	const newItems = [...element.children];
	const newCount = newItems.length;

	const offset = 20;

	newItems.forEach((el, i) => {
	el.style.opacity = "0";
	el.style.transform = `translateY(${offset}px)`;

		el.animate(
			[
			{ opacity: 0, transform: `translateY(${offset}px)` },
			{ opacity: 1, transform: "translateY(0)" }
			],
			{
			duration: 250,
			easing: "ease-out",
			delay: i * 15, 
			fill: "forwards"
			}
		);
	});
}


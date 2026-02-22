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
  let selectedDrive = document.getElementById("selectedDrive");
  let lastBtn = false
  let lastSubBtn = false
//-----------------------------------------------------------------------
  let openSubfolder = function(idx, name , subname, buttonEl) {
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
  }
//-----------------------------------------------------------------------
  let openFolder = function(idx, name, buttonEl) {
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
      html += `<button onclick="openSubfolder(${idx},'${name}', '${key}', this)">${key}</button>`;
    }

    for (let i = 0; i<folder.files.length; i++) {
      html += "<div>"+folder.files[i]+"</div>"
    }

     outputFolder.innerHTML = html
     outputSubfolder.innerHTML = ""
  }
//-----------------------------------------------------------------------
  let selectDrive = function(idx) {
    let html = ""
    
    selectedDrive.textContent = jsonData[idx].drive

    for (const [key, value] of Object.entries(jsonData[idx].folders)) {
      html += `<button onclick="openFolder(${idx}, '${key}', this)">${key}</button>`;
    }

    for (let i = 0; i<jsonData[idx].root_files.length; i++) {
      html += "<div>"+jsonData[idx].root_files[i]+"</div>"
    }
    output.innerHTML = html
    outputFolder.innerHTML = ""
    outputSubfolder.innerHTML = ""
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
    
    btn.onclick = () => selectDrive(i)
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


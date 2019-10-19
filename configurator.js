const SUPPORTED_ENTITIES = ["blind", "light", "media_player"];
const DEBUG_HOST = "10.2.1.217";

const UI_ELEMENTS = {
  integrations: ["intergrations"],
  entities: ["entities"],
  areas: ["areas", "areasArea"],
  advanced: ["configFile"],
  settings: ["settings"],
  profiles: ["ui_config.profiles"],
  groups: ["ui_config.groups", "toolEntities"],
  pages: ["ui_config.pages", "toolGroups"],
  DoNotShowDefault: ["manageProfile", "toolPages", "managePage"]
};

let socket; //websocket handle
let configObj; //Config.json in object form
let dragSelection = ""; //Selection for when multiple dragable item groups are possible.
let editKey; //Global Active Key ID being edited.

function wsConnect(url) {
  socket = new WebSocket(url);
  console.log(`Connecting to host: "${host}"`);

  socket.onopen = function(e) {
    console.log("[open] Connection established");
    console.log("Sending auth request to server");
    socket.send(buildAuthPacket("0"));
  };

  socket.onmessage = function(event) {
    const messageJson = event.data;
    messageObj = JSON.parse(messageJson);
    console.log(`[message] Data received from server`);
    if (messageObj.type && messageObj.type === "auth_ok") {
      console.log("Sending configJson request to server");
      wsGetConfig();
    }
    if (messageObj.type && messageObj.type === "config") {
      configObj = messageObj.config;
      updateGuiByConfigObj();
    }
  };

  socket.onclose = function(event) {
    if (event.wasClean) {
      console.log(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
    } else {
      // e.g. server process killed or network down
      // event.code is usually 1006 in this case
      console.log("[close] Connection died");
    }
  };

  socket.onerror = function(error) {
    console.log(`[error] ${error.message}`);
  };
}

function wsGetConfig() {
  socket.send(`{"type":"getconfig"}`);
}

function wsSetConfig() {
  try {
    //Try parsing configuration. Fail on error
    let confJson = document.getElementById("configJsonTextBox").value;
    configObj = JSON.parse(confJson);
    socket.send(`{"type":"setconfig", "config":${confJson}}`);
    console.log("Config save requested");
    updateGuiByConfigObj();
  } catch (e) {
    alert(`Failed to save configuration with error: ${e.message}`);
    console.log(`Failed to save configuration with error: ${e.message}`);
  }
}

function buildAuthPacket(token) {
  return `{"type":"auth","token": "${token}"}`;
}

function toolGenerateUuidv4() {
  return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16));
}

function updateGuiByConfigObj() {
  if (configObj) updateGuiMainConfigJsonText(configObj);
  if (configObj.areas) updateGuiMainAreas(configObj.areas);
  if (configObj.entities) updateGuiMainEntities(configObj.entities);
  if (configObj.entities) updateGuiToolEntities(configObj.entities);
  if (configObj.integrations) updateGuiMainIntegrations(configObj.integrations);
  if (configObj.settings) updateGuiMainSettings(configObj.settings, configObj.ui_config);
  if (configObj.ui_config.groups) updateGuiMainGroups(configObj.ui_config, configObj.entities);
  if (configObj.ui_config.groups) updateGuiToolGroups(configObj.ui_config.groups);
  if (configObj.ui_config.pages) updateGuiMainPages(configObj.ui_config);
  if (configObj.ui_config.pages) updateGuiToolPages(configObj.ui_config.pages);
  if (configObj.ui_config.profiles) updateGuiMainProfiles(configObj.ui_config, configObj.entities);
}

function setGuiActive(element) {
  //Set visibility to false on all.
  const keys = Object.keys(UI_ELEMENTS);
  for (let key of keys) {
    for (let elmnt of UI_ELEMENTS[key]) {
      setGuiVisibilityOfId(elmnt, false);
    }
  }

  //Set visibility to true for required elements.
  try {
    for (let elmnt of UI_ELEMENTS[element]) {
      setGuiVisibilityOfId(elmnt, true);
    }
  } catch (e) {}
}

function setGuiVisibilityOfId(id, visibility) {
  let element = document.getElementById(id);
  if (visibility) {
    element.style.display = "block";
  } else {
    element.style.display = "none";
  }
}

function updateGuiMainConfigJsonText(confObj) {
  let confJson = JSON.stringify(confObj, null, 2);
  document.getElementById("configJsonTextBox").value = confJson;
}

function updateGuiMainAreas(areas) {
  let innerHtml = "<h3>Configuration Areas</h3>";
  for (let area of areas) {
    innerHtml += `<div class="configItem"><b>${area.area}</b><a class="small">${area.bluetooth}</a></div>`;
  }
  document.getElementById("areas").innerHTML = innerHtml;
}

function updateGuiMainEntities(entities) {
  let entityHtml = "<h3>Configuration Entities</h3>";
  for (let type of SUPPORTED_ENTITIES) {
    for (let entity of entities[type]) {
      entityHtml += `<div class="configItem"><b>${entity.friendly_name}</b> <a class="small">${entity.area}</a></div>`;
    }
  }
  document.getElementById("entities").innerHTML = entityHtml;
}

function updateGuiMainIntegrations(integrations) {
  let innerHtml = "<h3>Integrations</h3>";

  const keys = Object.keys(integrations);

  for (let key of keys) {
    for (let integration of integrations[key].data) {
      innerHtml += `<div class="configItem"><b>${integration.friendly_name}</b><a class="small">${key}</a></div>`;
    }
  }

  document.getElementById("intergrations").innerHTML = innerHtml;
}

function updateGuiMainSettings(settings, ui_config) {
  let innerHtml = "<h3>Configuration Settings</h3>";

  innerHtml += `<div class="configItem"><div>Dark mode <input type="checkbox" id="ui_config.darkmode" name="darkmode" ${isChecked(ui_config.darkmode)}></div></div>`;
  innerHtml += `<div class="configItem"><div>Auto brightness <input type="checkbox" id="settings.autobrightness" name="autobrightness" ${isChecked(settings.autobrightness)}></div></div>`;
  innerHtml += `<div class="configItem"><div>Bluetooth area <input type="checkbox" id="settings.bluetootharea" name="bluetootharea" ${isChecked(settings.bluetootharea)}></div></div>`;
  innerHtml += `<div class="configItem"><div>Software Updates <input type="checkbox" id="settings.softwareupdate" name="softwareupdate"></div></div>`;
  innerHtml += `<div class="configItem"><div>Language <select id="settings.language" name="language">`;
  innerHtml += `<option value="en_US">en_US</option>`;
  innerHtml += `<option value="nl_NL">nl_NL</option>`;
  innerHtml += `<option value="de_DE">de_DE</option>`;
  innerHtml += `<option value="jp_JS">jp_JS</option>`;
  innerHtml += `</select></div></div>`;
  innerHtml += `<div class="configItem"><div>Proximity <input type="number" id="settings.proximity" name="proximity"min="10" max="250"></div></div>`;
  innerHtml += `<div class="configItem"><div>Shutdowntime <input type="number" id="settings.shutdowntime" name="shutdowntime"min="0" max="36000"></div></div>`;
  innerHtml += `<div class="configItem"><div>WiFi time <input type="number" id="settings.wifitime" name="wifitime"min="0" max="36000"></div></div>`;

  document.getElementById("settings").innerHTML = innerHtml;
  document.getElementById("settings.language").value = settings.language;
  document.getElementById("settings.proximity").value = settings.proximity;
  document.getElementById("settings.shutdowntime").value = settings.shutdowntime;
  document.getElementById("settings.softwareupdate").checked = settings.softwareupdate;
  document.getElementById("settings.wifitime").value = settings.wifitime;
}

function updateGuiMainGroups(uiConfig, entities) {
  let innerHtml = "<h3>Configuration Groups</h3>";
  const keys = Object.keys(uiConfig.groups);
  let ulArray = [];

  for (let key of keys) {
    const group = uiConfig.groups[key];
    let ulID = `uiConfig.groups.entities.${key}`;
    ulArray.push(ulID);

    innerHtml += `<div class="blockMedium"></div>`;
    innerHtml += `<div class="configGroup">`;
    innerHtml += `<h4>${group.name}</h4>`;
    innerHtml += `<div class="configItem"><div>Group switch <input type="checkbox" id="groups.${key}.switch" name="groups.${key}.switch" ${isChecked(group.switch)}></div></div>`;

    innerHtml += `<ul id="${ulID}" yioConfig="groups" yioConfigKey="${key}" yioSubConfig="entities" class="dragList">`;
    for (let entity of group.entities) {
      const ent = getEntityById(entities, entity);
      if (ent.friendly_name) {
        innerHtml += `<li class="dragableItem" id="${entity}"><b>${ent.friendly_name}</b> <a class="small">${ent.area}</a></li>`;
      } else {
        innerHtml += `<li class="configItemError"><b> No entity found with UUID: "${entity}" !</b></li>`;
      }
    }
    innerHtml += `</ul></div>`;
  }

  document.getElementById("ui_config.groups").innerHTML = innerHtml;

  //make list items dragable in ul

  makeDragableGroups(ulArray);
}

function updateGuiMainPages(uiConfig) {
  let innerHtml = "<h3>Configuration Pages</h3>";
  innerHtml += `<button type="button" onclick="mainPageManage();">Add new page</button>`;

  const keys = Object.keys(uiConfig.pages);
  let ulArray = [];

  for (let key of keys) {
    const page = uiConfig.pages[key];
    let ulID = `uiConfig.pages.groups.${key}`;
    ulArray.push(ulID);

    innerHtml += `<div class="blockMedium"></div>`;
    innerHtml += `<div class="configGroup">`;
    innerHtml += `<h4>${page.name}</h4>`;
    innerHtml += `<button type="button" onclick="mainPageManage('${key}');">Edit ${page.name}</button><br>`;
    innerHtml += `<div class="blockSmall"></div>`;
    innerHtml += `<div class="configItem"><div>Image: ${page.image}</div></div>`;
    innerHtml += `<ul id="${ulID}" yioConfig="pages" yioConfigKey="${key}" yioSubConfig="groups" class="dragList">`;
    for (let group of page.groups) {
      const grp = uiConfig.groups[group];
      if (grp) {
        innerHtml += `<li class="dragableItem" id="${group}"><b>${grp.name}</b></li>`;
      } else {
        innerHtml += `<div class="configItemError"><b> No group found with UUID: "${group}"</b></div>`;
      }
    }
    innerHtml += `</ul></div>`;
  }

  document.getElementById("ui_config.pages").innerHTML = innerHtml;

  //make list items dragable in ul

  makeDragableGroups(ulArray);
}

function updateGuiMainProfiles(uiConfig, entities) {
  let innerHtml = "<h3>Configuration Profiles</h3>";
  innerHtml += `<button type="button" onclick="mainProfileManage();">Add new profile</button><button type="button" onclick="changeDragSellection('F');">Edit Favorites</button><button type="button" onclick="changeDragSellection('P');"> Edit Pages</button>`;
  const keys = Object.keys(uiConfig.profiles);
  let ulArrayF = []; // UL array Favorites
  let ulArrayP = []; // UL array Pages

  let cssClassF;
  if (dragSelection === "F") {
    cssClassF = "dragableItem";
  } else {
    cssClassF = "configItem";
  }

  let cssClassP;
  if (dragSelection === "P") {
    cssClassP = "dragableItem";
  } else {
    cssClassP = "configItem";
  }

  for (let key of keys) {
    const profile = uiConfig.profiles[key];

    let ulIdF = `uiConfig.profiles.favorites.${key}`;
    ulArrayF.push(ulIdF);
    let ulIdP = `uiConfig.profiles.pages.${key}`;
    ulArrayP.push(ulIdP);

    innerHtml += `<div class="blockMedium"></div>`;
    innerHtml += `<div class="configGroup">`;
    innerHtml += `<h4>${profile.name}</h4>`;
    innerHtml += `<button type="button" onclick="mainProfileManage('${key}');">Edit ${profile.name}</button><br>`;

    // Favorites //
    innerHtml += `<h5>Favorites:</h5>`;
    innerHtml += `<ul id="${ulIdF}" yioConfig="profiles" yioConfigKey="${key}" yioSubConfig="favorites" class="dragList">`;
    for (let favorite of profile.favorites) {
      const entity = getEntityById(entities, favorite);
      if (entity.friendly_name) {
        innerHtml += `<li class="${cssClassF}" id="${favorite}"><b>${entity.friendly_name}</b> <a class="small">${entity.area}</a></li>`;
      } else {
        innerHtml += `<li class="${cssClassF}Error" id="ERROR"><b>No entity found with UUID: "${favorite}"</b></li>`;
      }
    }
    innerHtml += `</ul>`;

    // Pages //
    innerHtml += `<h5>Pages:</h5>`;
    innerHtml += `<ul id="${ulIdP}" yioConfig="profiles" yioConfigKey="${key}" yioSubConfig="pages" class="dragList">`;
    for (let page of profile.pages) {
      if (page === "favorites" || page === "settings") {
        let name = page.charAt(0).toUpperCase() + page.slice(1);
        innerHtml += `<li class="${cssClassP}" id="${page}"><b>${name}</b></li>`;
      } else {
        const pag = uiConfig.pages[page];
        if (pag) {
          innerHtml += `<li class="${cssClassP}" id="${page}"><b>${pag.name}</b></li>`;
        } else {
          innerHtml += `<li class="${cssClassP}Error" id="ERROR"><b>No page found with UUID: "${page}"</b></li>`;
        }
      }
    }
    innerHtml += `</ul></div>`;
  }
  document.getElementById("ui_config.profiles").innerHTML = innerHtml;

  //make list items dragable in ul
  if (dragSelection === "F") {
    makeDragableGroups(ulArrayF);
  }

  if (dragSelection === "P") {
    makeDragableGroups(ulArrayP);
  }
}

function updateGuiToolPages(pages) {
  let innerHtml = "<h3> Pages</h3>";
  innerHtml += `<ul id="tool.pages" class="toolDragList">`;
  innerHtml += `<li class="dragableItem" id="favorites"><b>Favorites</b><a class="small">YIO Reserved</a></li>`;
  innerHtml += `<li class="dragableItem" id="settings"><b>Settings</b><a class="small">YIO Reserved</a></li>`;
  const keys = Object.keys(pages);
  for (let key of keys) {
    innerHtml += `<li class="dragableItem" id="${key}"><b>${pages[key].name}</b> </li>`;
  }
  innerHtml += `</ul>`;
  document.getElementById("toolPages").innerHTML = innerHtml;
  makeDragableGroups(["tool.pages"]);
}

function updateGuiToolGroups(groups) {
  let innerHtml = "<h3> groups</h3>";
  innerHtml += `<ul id="tool.groups" class="toolDragList">`;
  const keys = Object.keys(groups);
  for (let key of keys) {
    innerHtml += `<li class="dragableItem" id="${key}"><b>${groups[key].name}</b> </li>`;
  }
  innerHtml += `</ul>`;
  document.getElementById("toolGroups").innerHTML = innerHtml;
  makeDragableGroups(["tool.groups"]);
}

function updateGuiToolEntities(entities) {
  let innerHtml = "<h3> Entities</h3>";
  let ulArray = [];

  for (let type of SUPPORTED_ENTITIES) {
    let ulID = `tool.entities.${type}`;
    ulArray.push(ulID);
    innerHtml += `<ul id="${ulID}" class="toolDragList">`;

    for (let entity of entities[type]) {
      innerHtml += `<li class="dragableItem" id="${entity.entity_id}"><b>${entity.friendly_name}</b> <a class="small">${entity.area}</a></li>`;
    }
    innerHtml += `</ul>`;
  }
  document.getElementById("toolEntities").innerHTML = innerHtml;
  makeDragableGroups(ulArray);
}

function changeDragSellection(sellection) {
  // used on profiles as there are two dragable types. we don't want to mistake and drag an entity as a page.
  dragSelection = sellection;
  updateGuiByConfigObj();
  setGuiVisibilityOfId("toolEntities", false);
  setGuiVisibilityOfId("toolPages", false);
  setGuiVisibilityOfId("manageProfile", false);
  if (dragSelection === "F") setGuiVisibilityOfId("toolEntities", true);
  if (dragSelection === "P") setGuiVisibilityOfId("toolPages", true);
  if (dragSelection === "M") setGuiVisibilityOfId("manageProfile", true);
}

function mainProfileManage(profileKey) {
  changeDragSellection("M");
  let manageProfileName = document.getElementById("manageProfile.name");
  if (profileKey) {
    editKey = profileKey;
    manageProfileName.value = configObj.ui_config.profiles[profileKey].name;
  } else {
    editKey = toolGenerateUuidv4();
    manageProfileName.value = "";
  }
}

function toolProfileSave() {
  let manageProfileName = document.getElementById("manageProfile.name");
  if (manageProfileName.value != "") {
    if (configObj.ui_config.profiles[editKey]) {
      configObj.ui_config.profiles[editKey].name = manageProfileName.value;
    } else {
      configObj.ui_config.profiles[editKey] = { name: manageProfileName.value, favorites: [], pages: [] };
    }
    manageProfileName.value = "";
    editKey = "";
    setGuiVisibilityOfId("manageProfile", false);
    updateGuiByConfigObj();
    wsSetConfig();
  } else {
    alert("ERROR: Name must have a value");
  }
}

function toolProfileCancel() {
  let manageProfileName = document.getElementById("manageProfile.name");
  manageProfileName.value = "";
  editKey = "";
  setGuiVisibilityOfId("manageProfile", false);
}

function toolProfileRemove() {
  if (configObj.ui_config.profiles[editKey]) {
    delete configObj.ui_config.profiles[editKey];
  }
  let manageProfileName = document.getElementById("manageProfile.name");
  manageProfileName.value = "";
  editKey = "";
  setGuiVisibilityOfId("manageProfile", false);
  updateGuiByConfigObj();
  wsSetConfig();
}

function mainPageManage(profileKey) {
  setGuiVisibilityOfId("toolGroups", false);
  setGuiVisibilityOfId("managePage", true);
  let managePageName = document.getElementById("managePage.name");
  if (profileKey) {
    editKey = profileKey;
    managePageName.value = configObj.ui_config.pages[profileKey].name;
  } else {
    editKey = toolGenerateUuidv4();
    managePageName.value = "";
  }
}

function toolPageSave() {
  let managePageName = document.getElementById("managePage.name");
  if (managePageName.value != "") {
    if (configObj.ui_config.pages[editKey]) {
      configObj.ui_config.pages[editKey].name = managePageName.value;
    } else {
      configObj.ui_config.pages[editKey] = { name: managePageName.value, groups: [], image: "" };
    }
    managePageName.value = "";
    editKey = "";
    setGuiVisibilityOfId("toolGroups", true);
    setGuiVisibilityOfId("managePage", false);
    updateGuiByConfigObj();
    wsSetConfig();
  } else {
    alert("ERROR: Name must have a value");
  }
}

function toolPageCancel() {
  let managePageName = document.getElementById("managePage.name");
  managePageName.value = "";
  editKey = "";
  setGuiVisibilityOfId("toolGroups", true);
  setGuiVisibilityOfId("managePage", false);
}

function toolPageRemove() {
  // if the page exist then delete it.
  if (configObj.ui_config.pages[editKey]) {
    delete configObj.ui_config.pages[editKey];
  }

  // Clean up all references in profiles.
  if (configObj.ui_config.profiles) {
    for (let i in configObj.ui_config.profiles) {
      let index = configObj.ui_config.profiles[i].pages.indexOf(editKey);

      if (index > -1) {
        configObj.ui_config.profiles[i].pages.splice(index, 1);
      }
    }
  }

  let managePageName = document.getElementById("managePage.name");
  managePageName.value = "";
  editKey = "";
  setGuiVisibilityOfId("managePage", false);
  updateGuiByConfigObj();
  wsSetConfig();
}

function isChecked(booli) {
  if (booli) {
    return "checked";
  } else {
    return "";
  }
}

function getEntityById(entities, key) {
  let returnEntity = {};
  for (let type of SUPPORTED_ENTITIES) {
    for (let entity of entities[type]) {
      if (entity.entity_id === key) returnEntity = entity;
    }
  }
  return returnEntity;
}

function downloadConfig() {
  let confJson = document.getElementById("configJsonTextBox").value;
  download("config.json", confJson);
}

function download(filename, text) {
  var pom = document.createElement("a");
  pom.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(text));
  pom.setAttribute("download", filename);

  if (document.createEvent) {
    var event = document.createEvent("MouseEvents");
    event.initEvent("click", true, true);
    pom.dispatchEvent(event);
  } else {
    pom.click();
  }
}

function arrayMove(arr, oldIndex, newIndex) {
  if (newIndex >= arr.length) {
    var k = newIndex - arr.length + 1;
    while (k--) {
      arr.push(undefined);
    }
  }
  arr.splice(newIndex, 0, arr.splice(oldIndex, 1)[0]);
  return arr; // for testing
}

function makeDragableGroups(ulArray) {
  for (let id of ulArray) {
    let x = document.getElementById(id);
    new Sortable(x, {
      group: "words",
      onStart: function(/**Event*/ evt) {
        console.log("onStart.foo:", evt.item);
        console.log(evt.oldIndex);
      },
      onAdd: function(evt) {
        dragableAdd(evt);
      },
      onUpdate: function(evt) {
        dragableMoved(evt);
      },
      onRemove: function(evt) {
        dragableRemove(evt);
      }
    });
  }
}

function dragableMoved(evt) {
  if (evt.from.attributes.yioConfig && evt.from.attributes.yioConfigKey && evt.from.attributes.yioSubConfig) {
    let yioConfig = evt.from.attributes.yioConfig.value;
    let yioConfigKey = evt.from.attributes.yioConfigKey.value;
    let yioSubConfig = evt.from.attributes.yioSubConfig.value;
    let oldIndex = evt.oldIndex;
    let newIndex = evt.newIndex;
    console.log("Item moved");
    console.log(`yioConfig ${yioConfig}`);
    console.log(`yioConfigKey ${yioConfigKey}`);
    console.log(`yioSubConfig ${yioSubConfig}`);
    console.log("From:", oldIndex);
    console.log("To:", newIndex);

    arrayMove(configObj.ui_config[yioConfig][yioConfigKey][yioSubConfig], oldIndex, newIndex);
  }
  updateGuiByConfigObj();
  wsSetConfig();
}

function dragableAdd(evt) {
  if (evt.to.attributes.yioConfig && evt.to.attributes.yioConfigKey && evt.to.attributes.yioSubConfig) {
    let yioConfigTo = evt.to.attributes.yioConfig.value;
    let yioConfigKeyTo = evt.to.attributes.yioConfigKey.value;
    let yioSubConfigTo = evt.to.attributes.yioSubConfig.value;
    let newIndex = evt.newIndex;
    let itemId = evt.item.id;
    console.log("Item Added");
    console.log(`yioConfigTo ${yioConfigTo}`);
    console.log(`yioConfigKeyTo ${yioConfigKeyTo}`);
    console.log(`yioSubConfigTo ${yioSubConfigTo}`);
    console.log("To:", newIndex);

    configObj.ui_config[yioConfigTo][yioConfigKeyTo][yioSubConfigTo].splice(newIndex, 0, itemId);
  }
  updateGuiByConfigObj();
  wsSetConfig();
}

function dragableRemove(evt) {
  if (evt.from.attributes.yioConfig && evt.from.attributes.yioConfigKey && evt.from.attributes.yioSubConfig) {
    let yioConfig = evt.from.attributes.yioConfig.value;
    let yioConfigKey = evt.from.attributes.yioConfigKey.value;
    let yioSubConfig = evt.from.attributes.yioSubConfig.value;
    let oldIndex = evt.oldIndex;
    console.log("Item Removed");
    console.log(`yioConfig ${yioConfig}`);
    console.log(`yioConfigKey ${yioConfigKey}`);
    console.log(`yioSubConfig ${yioSubConfig}`);
    console.log("From:", oldIndex);

    configObj.ui_config[yioConfig][yioConfigKey][yioSubConfig].splice(oldIndex, 1);
  }
  updateGuiByConfigObj();
  wsSetConfig();
}

/////////// Start /////////////////
setGuiActive("None");
let host = window.location.hostname;
if (host === "") {
  host = DEBUG_HOST;
  console.log(`::: Using debug host: "${host}" :::`);
}
wsConnect(`ws://${host}:946`);

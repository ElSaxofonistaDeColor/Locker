// Script de control de porta amb botó i llum verda
// Input 0 (S1): Sensor porta | Input 1 (S2): Botó
// Switch 0: Llum verda | Switch 1: Actuador porta

let portaObrint = false;

function llumVerdaEncesa(callback) {
  Shelly.call("Switch.GetStatus", {id: 0}, function(result) {
    callback(result && result.output === true);
  });
}

function portaTancada(callback) {
  Shelly.call("Input.GetStatus", {id: 0}, function(result) {
    callback(result && result.state === false);
  });
}

function activarActuador() {
  Shelly.call("Switch.Set", {id: 1, on: true}, function() {
    print("Actuador activat - obrint porta");
    portaObrint = true;
  });
}

function desactivarActuador() {
  Shelly.call("Switch.Set", {id: 1, on: false}, function() {
    print("Actuador desactivat");
    portaObrint = false;
  });
}

function processarPulsacioBoto() {
  print("Botó premut");
  llumVerdaEncesa(function(encesa) {
    if (!encesa) {
      print("Llum verda apagada - accés denegat");
      return;
    }
    portaTancada(function(tancada) {
      if (!tancada) {
        print("Porta ja oberta");
        return;
      }
      print("Obrint porta");
      activarActuador();
    });
  });
}

Shelly.addEventHandler(function(event) {
  if (event.component === "input:1") {
    if (event.info.event === "single_push" || event.info.event === "btn_down") {
      processarPulsacioBoto();
    }
  }
  if (event.component === "input:0" && event.info.state === true && portaObrint) {
    print("Porta oberta - desactivant actuador");
    desactivarActuador();
  }
});

print("Script control porta actiu");

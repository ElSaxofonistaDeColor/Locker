// Script de control de porta amb botó i llum verda
// Input 0 (S1): Sensor porta (true=tancada, false=oberta)
// Input 1 (S2): Botó client
// Switch 0 (Output 0): Actuador porta
// Switch 1 (Output 1): Llum verda

let portaObrint = false;

function llumVerdaEncesa(callback) {
  print("DEBUG: Comprovant estat llum verda (Switch 1)...");
  Shelly.call("Switch.GetStatus", {id: 1}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR llum verda:", error_code, error_message);
      callback(false);
      return;
    }
    print("DEBUG: Llum verda output =", result.output);
    callback(result && result.output === true);
  });
}

function portaTancada(callback) {
  print("DEBUG: Comprovant estat porta (Input 0)...");
  Shelly.call("Input.GetStatus", {id: 0}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR porta:", error_code, error_message);
      callback(false);
      return;
    }
    print("DEBUG: Porta state =", result.state, "(true=tancada, false=oberta)");
    callback(result && result.state === true);
  });
}

function activarActuador() {
  print("DEBUG: Activant actuador (Switch 0)...");
  Shelly.call("Switch.Set", {id: 0, on: true}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR activant actuador:", error_code, error_message);
      return;
    }
    print("*** ACTUADOR ACTIVAT - OBRINT PORTA ***");
    portaObrint = true;
  });
}

function desactivarActuador() {
  print("DEBUG: Desactivant actuador (Switch 0)...");
  Shelly.call("Switch.Set", {id: 0, on: false}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR desactivant actuador:", error_code, error_message);
      return;
    }
    print("*** ACTUADOR DESACTIVAT ***");
    portaObrint = false;
  });
}

function apagarLlumVerda() {
  print("DEBUG: Apagant llum verda (Switch 1)...");
  Shelly.call("Switch.Set", {id: 1, on: false}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR apagant llum verda:", error_code, error_message);
      return;
    }
    print("*** LLUM VERDA APAGADA ***");
  });
}

function processarPulsacioBoto() {
  print("========================================");
  print("*** BOTO PREMUT ***");
  print("========================================");

  llumVerdaEncesa(function(encesa) {
    print("DEBUG: Resultat llum verda encesa =", encesa);
    if (!encesa) {
      print(">>> ACCES DENEGAT: Llum verda apagada");
      return;
    }

    print("DEBUG: Llum verda OK, comprovant porta...");
    portaTancada(function(tancada) {
      print("DEBUG: Resultat porta tancada =", tancada);
      if (!tancada) {
        print(">>> ACCES DENEGAT: Porta ja oberta");
        return;
      }

      print(">>> CONDICIONS OK - OBRINT PORTA");
      activarActuador();
    });
  });
}

// Gestor d'esdeveniments
Shelly.addEventHandler(function(event) {
  print("DEBUG: Event rebut:", JSON.stringify(event));

  // Botó premut (Input 1)
  if (event.component === "input:1") {
    print("DEBUG: Event d'Input 1 detectat");
    if (event.info.event === "single_push" || event.info.event === "btn_down") {
      print("DEBUG: Tipus event:", event.info.event);
      processarPulsacioBoto();
    } else {
      print("DEBUG: Event ignorat, tipus:", event.info.event);
    }
  }

  // Porta oberta (Input 0)
  if (event.component === "input:0") {
    print("DEBUG: Event d'Input 0 (porta) - state:", event.info.state, "portaObrint:", portaObrint);
    if (event.info.state === false && portaObrint) {
      print("*** PORTA OBERTA DETECTADA ***");
      desactivarActuador();
      apagarLlumVerda();
    }
  }
});

print("========================================");
print("SCRIPT CONTROL PORTA ACTIU (DEBUG MODE)");
print("========================================");
print("Input 0: Sensor porta (true=tancada, false=oberta)");
print("Input 1: Boto client");
print("Output 0: Actuador porta");
print("Output 1: Llum verda");
print("========================================");

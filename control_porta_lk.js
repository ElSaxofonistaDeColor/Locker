// Script de control de porta per Shelly Plus 1 PM (1 switch)
// Adaptat per dispositius Lk01-Lk06
//
// Input 0 (S1): Sensor porta (true=tancada, false=oberta)
// Input 1 (S2): Botó client
// Switch 0: Actuador porta (ÚNIC SWITCH DISPONIBLE)
//
// NOTA: Aquest model NO té switch per llum verda externa
// La combinació secreta funciona sense necessitat de llum verda

let portaObrint = false;
let timerAutoOff = null;

// Variables per la combinació secreta
let combinacioSecreta = ["long", "short", "short", "short", "long", "short"];
let combinacioActual = [];
let ultimaPulsacio = 0;
let TIMEOUT_COMBINACIO = 5000; // 5 segons per completar la combinació
let TIMEOUT_AUTO_OFF = 1000; // 1 segon per desactivar l'actuador automàticament
let timerReset = null;

function portaTancada(callback) {
  Shelly.call("Input.GetStatus", {id: 0}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR porta:", error_code, error_message);
      callback(false);
      return;
    }
    callback(result && result.state === true);
  });
}

function activarActuador() {
  Shelly.call("Switch.Set", {id: 0, on: true}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR activant actuador:", error_code, error_message);
      return;
    }
    print("*** ACTUADOR ACTIVAT ***");
    portaObrint = true;

    // Cancel·lar timer anterior si existeix
    if (timerAutoOff !== null) {
      Timer.clear(timerAutoOff);
    }

    // Programar desactivació automàtica després d'1 segon (protecció del relé)
    timerAutoOff = Timer.set(TIMEOUT_AUTO_OFF, false, function() {
      print("*** AUTO-OFF: Desactivant actuador després d'1 segon (protecció relé) ***");
      desactivarActuador();
      timerAutoOff = null;
    });
  });
}

function desactivarActuador() {
  // Cancel·lar el timer d'auto-off si existeix
  if (timerAutoOff !== null) {
    Timer.clear(timerAutoOff);
    timerAutoOff = null;
  }

  Shelly.call("Switch.Set", {id: 0, on: false}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR desactivant actuador:", error_code, error_message);
      return;
    }
    print("*** ACTUADOR DESACTIVAT ***");
    portaObrint = false;
  });
}

function resetCombinacio() {
  combinacioActual = [];
  if (timerReset !== null) {
    Timer.clear(timerReset);
    timerReset = null;
  }
}

function comprovarCombinacio() {
  if (combinacioActual.length !== combinacioSecreta.length) {
    return false;
  }

  for (let i = 0; i < combinacioSecreta.length; i++) {
    if (combinacioActual[i] !== combinacioSecreta[i]) {
      return false;
    }
  }

  return true;
}

function afegirPulsacio(tipus) {
  let ara = Date.now();

  // Si ha passat massa temps, reset
  if (ara - ultimaPulsacio > TIMEOUT_COMBINACIO) {
    resetCombinacio();
  }

  // Cancel·lar el timer anterior si existeix
  if (timerReset !== null) {
    Timer.clear(timerReset);
    timerReset = null;
  }

  ultimaPulsacio = ara;
  combinacioActual.push(tipus);

  print(JSON.stringify(combinacioActual));

  // Si la combinació és massa llarga, mantenir només els últims N elements
  if (combinacioActual.length > combinacioSecreta.length) {
    let nova = [];
    for (let i = 1; i < combinacioActual.length; i++) {
      nova.push(combinacioActual[i]);
    }
    combinacioActual = nova;
  }

  // Comprovar si la combinació és correcta
  if (comprovarCombinacio()) {
    resetCombinacio();
    return true;
  }

  // Si la combinació no està completa, programar reset automàtic
  if (combinacioActual.length > 0) {
    timerReset = Timer.set(TIMEOUT_COMBINACIO, false, function() {
      print("Timeout - Reiniciant combinació per inactivitat");
      resetCombinacio();
    });
  }

  return false;
}

function processarPulsacioBoto() {
  portaTancada(function(tancada) {
    if (!tancada) {
      print(">>> ACCES DENEGAT: Porta ja oberta");
      return;
    }
    print(">>> OBRINT PORTA");
    activarActuador();
  });
}

// Gestor d'esdeveniments
Shelly.addEventHandler(function(event) {
  // Botó premut (Input 1)
  if (event.component === "input:1") {

    if (event.info.event === "long_push") {
      print("LLARG");
      if (afegirPulsacio("long")) {
        print(">>> COMBINACIO SECRETA CORRECTA!");
        activarActuador();
      }
    }
    else if (event.info.event === "single_push") {
      print("CURT");
      if (afegirPulsacio("short")) {
        print(">>> COMBINACIO SECRETA CORRECTA!");
        activarActuador();
      }
    }
    else if (event.info.event === "double_push") {
      print("DOBLE");
      // Afegir dues pulsacions curtes
      if (afegirPulsacio("short")) {
        print(">>> COMBINACIO SECRETA CORRECTA!");
        activarActuador();
        return;
      }
      if (afegirPulsacio("short")) {
        print(">>> COMBINACIO SECRETA CORRECTA!");
        activarActuador();
      }
    }
  }

  // Porta oberta (Input 0)
  if (event.component === "input:0") {
    if (event.info.state === false && portaObrint) {
      print("*** PORTA OBERTA ***");
      desactivarActuador();
    }
  }
});

print("========================================");
print("SCRIPT CONTROL PORTA LK ACTIU");
print("========================================");
print("Model: Shelly Plus 1 PM");
print("Input 0: Sensor porta (true=tancada, false=oberta)");
print("Input 1: Boto client");
print("Output 0: Actuador porta");
print("Combinacio secreta: LLARG-CURT-CURT-CURT-LLARG-CURT");
print("Proteccio rele: AUTO-OFF 1 segon");
print("========================================");

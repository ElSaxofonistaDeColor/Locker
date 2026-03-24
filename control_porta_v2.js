// Script de control de porta amb botó i llum verda + Combinació Secreta
// Input 0 (S1): Sensor porta (true=tancada, false=oberta)
// Input 1 (S2): Botó client
// Switch 0 (Output 0): Actuador porta
// Switch 1 (Output 1): Llum verda
//
// V2: Afegeix combinació secreta: LLARG-CURT-CURT-CURT-LLARG-CURT

let portaObrint = false;

// Variables per la combinació secreta
let combinacioSecreta = ["long", "short", "short", "short", "long", "short"];
let combinacioActual = [];
let ultimaPulsacio = 0;
let TIMEOUT_COMBINACIO = 5000; // 5 segons per completar la combinació
let timerReset = null; // Timer per reiniciar la combinació automàticament
let LLARG_THRESHOLD = 500; // Temps en ms per considerar una pulsació llarga
let btnDownTime = 0; // Temps quan es prem el botó

function llumVerdaEncesa(callback) {
  Shelly.call("Switch.GetStatus", {id: 1}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR llum verda:", error_code, error_message);
      callback(false);
      return;
    }
    callback(result && result.output === true);
  });
}

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
  });
}

function desactivarActuador() {
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
  Shelly.call("Switch.Set", {id: 1, on: false}, function(result, error_code, error_message) {
    if (error_code !== 0) {
      print("ERROR apagant llum verda:", error_code, error_message);
      return;
    }
    print("*** LLUM VERDA APAGADA ***");
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
      // Si només hi ha 1 pulsació "short", activar mode normal
      if (combinacioActual.length === 1 && combinacioActual[0] === "short") {
        processarPulsacioBoto();
      }
      resetCombinacio();
    });
  }

  return false;
}

function processarPulsacioBoto() {
  llumVerdaEncesa(function(encesa) {
    if (!encesa) {
      print(">>> ACCES DENEGAT: Llum verda apagada");
      return;
    }
    portaTancada(function(tancada) {
      if (!tancada) {
        print(">>> ACCES DENEGAT: Porta ja oberta");
        return;
      }
      print(">>> MODE NORMAL - OBRINT PORTA");
      activarActuador();
    });
  });
}

// Gestor d'esdeveniments
Shelly.addEventHandler(function(event) {
  // Botó premut (Input 1)
  if (event.component === "input:1") {

    if (event.info.event === "long_push") {
      // Comprovar llum verda primer
      llumVerdaEncesa(function(encesa) {
        if (encesa) {
          // Llum verda encesa - mode normal immediat
          print("LLARG - MODE NORMAL");
          processarPulsacioBoto();
        } else {
          // Llum verda apagada - afegir a combinació
          print("LLARG");
          if (afegirPulsacio("long")) {
            print(">>> COMBINACIO SECRETA!");
            activarActuador();
          }
        }
      });
    }
    else if (event.info.event === "single_push") {
      // Comprovar llum verda primer
      llumVerdaEncesa(function(encesa) {
        if (encesa) {
          // Llum verda encesa - mode normal immediat
          print("CURT - MODE NORMAL");
          processarPulsacioBoto();
        } else {
          // Llum verda apagada - afegir a combinació
          print("CURT");
          if (afegirPulsacio("short")) {
            print(">>> COMBINACIO SECRETA!");
            activarActuador();
          }
        }
      });
    }
    else if (event.info.event === "double_push") {
      // Comprovar llum verda primer
      llumVerdaEncesa(function(encesa) {
        if (encesa) {
          // Llum verda encesa - ignorar
          print("DOBLE (ignorat - llum verda ON)");
        } else {
          // Llum verda apagada - afegir a combinació
          print("DOBLE");
          if (afegirPulsacio("short")) {
            print(">>> COMBINACIO SECRETA!");
            activarActuador();
            return;
          }
          if (afegirPulsacio("short")) {
            print(">>> COMBINACIO SECRETA!");
            activarActuador();
          }
        }
      });
    }
  }

  // Porta oberta (Input 0)
  if (event.component === "input:0") {
    if (event.info.state === false && portaObrint) {
      print("*** PORTA OBERTA ***");
      desactivarActuador();
      apagarLlumVerda();
    }
  }
});

print("========================================");
print("SCRIPT CONTROL PORTA V2 ACTIU");
print("========================================");
print("Input 0: Sensor porta (true=tancada, false=oberta)");
print("Input 1: Boto client");
print("Output 0: Actuador porta");
print("Output 1: Llum verda");
print("Combinacio secreta: LLARG-CURT-CURT-CURT-LLARG-CURT");
print("========================================");

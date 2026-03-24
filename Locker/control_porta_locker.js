

let CONFIG = {
  INPUT_PORTA: 0,
  INPUT_BOTO: 1,
  SWITCH_LLUM_VERDA: 1,
  SWITCH_ACTUADOR: 0
};

let portaTancada = true;

let combinacioSecreta = ["long", "short", "short", "short", "long", "short"];
let combinacioActual = [];
let ultimaPulsacio = 0;
let TIMEOUT_COMBINACIO = 5000;
let timerReset = null;

function llumVerdaEncesa(callback) {
  Shelly.call(
    "Switch.GetStatus",
    { id: CONFIG.SWITCH_LLUM_VERDA },
    function(result, error_code, error_message) {
      if (error_code !== 0) {
        print("Error obtenint estat llum verda:", error_message);
        callback(false);
        return;
      }
      callback(result.output === true);
    }
  );
}

function checkPortaTancada(callback) {
  Shelly.call(
    "Input.GetStatus",
    { id: CONFIG.INPUT_PORTA },
    function(result, error_code, error_message) {
      if (error_code !== 0) {
        print("Error obtenint estat porta:", error_message);
        callback(false);
        return;
      }

      callback(result.state === true);
    }
  );
}

function activarActuador() {
  Shelly.call(
    "Switch.Set",
    { id: CONFIG.SWITCH_ACTUADOR, on: true },
    function(result, error_code, error_message) {
      if (error_code !== 0) {
        print("Error activant actuador:", error_message);
        return;
      }
      print("Actuador activat - obrint porta");
      portaTancada = false;
    }
  );
}

function desactivarActuador() {
  Shelly.call(
    "Switch.Set",
    { id: CONFIG.SWITCH_ACTUADOR, on: false },
    function(result, error_code, error_message) {
      if (error_code !== 0) {
        print("Error desactivant actuador:", error_message);
        return;
      }
      print("Actuador desactivat");
      portaTancada = true;
    }
  );
}

function apagarLlumVerda() {
  Shelly.call(
    "Switch.Set",
    { id: CONFIG.SWITCH_LLUM_VERDA, on: false },
    function(result, error_code, error_message) {
      if (error_code !== 0) {
        print("Error apagant llum verda:", error_message);
        return;
      }
      print("Llum verda apagada");
    }
  );
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

  if (ara - ultimaPulsacio > TIMEOUT_COMBINACIO) {
    resetCombinacio();
  }

  if (timerReset !== null) {
    Timer.clear(timerReset);
    timerReset = null;
  }

  ultimaPulsacio = ara;
  combinacioActual.push(tipus);

  print("Combinació actual:", JSON.stringify(combinacioActual));

  if (combinacioActual.length > combinacioSecreta.length) {
    let nova = [];
    for (let i = 1; i < combinacioActual.length; i++) {
      nova.push(combinacioActual[i]);
    }
    combinacioActual = nova;
  }

  if (comprovarCombinacio()) {
    print("*** COMBINACIÓ SECRETA CORRECTA! ***");
    resetCombinacio();
    return true;
  }

  if (combinacioActual.length > 0) {
    timerReset = Timer.set(TIMEOUT_COMBINACIO, false, function() {
      print("Timeout - Reiniciant combinació per inactivitat");
      resetCombinacio();
    });
  }

  return false;
}

function processarPulsacioBoto() {
  print("Botó premut - verificant condicions...");

  llumVerdaEncesa(function(encesa) {
    if (!encesa) {
      print("Llum verda apagada - accés denegat");
      return;
    }

    print("Llum verda encesa - verificant estat porta...");

    checkPortaTancada(function(tancada) {
      if (!tancada) {
        print("La porta ja està oberta o obrint-se");
        return;
      }

      print("Condicions complides - obrint porta");
      activarActuador();
    });
  });
}

Shelly.addEventHandler(function(event) {
  print("Event rebut:", JSON.stringify(event));

  if (event.component === "input:" + CONFIG.INPUT_BOTO) {
    print("Event del botó detectat!");

    if (event.info.event === "long_push") {
      print("PULSACIÓ LLARGA");
      if (afegirPulsacio("long")) {
        print("Obrint per combinació secreta!");
        checkPortaTancada(function(tancada) {
          if (tancada) {
            activarActuador();
          } else {
            print("Porta ja oberta");
          }
        });
      }
    }
    else if (event.info.event === "single_push") {
      print("PULSACIÓ CURTA");
      if (afegirPulsacio("short")) {
        print("Obrint per combinació secreta!");
        checkPortaTancada(function(tancada) {
          if (tancada) {
            activarActuador();
          } else {
            print("Porta ja oberta");
          }
        });
      } else {

        processarPulsacioBoto();
      }
    }
    else if (event.info.event === "double_push") {
      print("PULSACIÓ DOBLE");

      if (afegirPulsacio("short")) {
        print("Obrint per combinació secreta!");
        checkPortaTancada(function(tancada) {
          if (tancada) {
            activarActuador();
          } else {
            print("Porta ja oberta");
          }
        });
        return;
      }
      if (afegirPulsacio("short")) {
        print("Obrint per combinació secreta!");
        checkPortaTancada(function(tancada) {
          if (tancada) {
            activarActuador();
          } else {
            print("Porta ja oberta");
          }
        });
      }
    }
    else if (event.info.event === "btn_down") {
      print("Tipus event btn_down");
      processarPulsacioBoto();
    }
  }

  if (event.component === "input:" + CONFIG.INPUT_PORTA) {
    if (event.info.state === false && !portaTancada) {
      print("Porta oberta detectada - desactivant actuador i apagant llum verda");
      desactivarActuador();
      apagarLlumVerda();
    }
  }
});

HTTPServer.registerEndpoint("button_pressed", function(request, response) {
  print("Webhook rebut - botó premut!");
  processarPulsacioBoto();
  response.code = 200;
  response.body = "OK";
  response.send();
});

print("========================================");
print("SCRIPT CONTROL PORTA LK07 ACTIU");
print("========================================");
print("- Input porta:", CONFIG.INPUT_PORTA);
print("- Input botó:", CONFIG.INPUT_BOTO);
print("- Switch llum verda:", CONFIG.SWITCH_LLUM_VERDA);
print("- Switch actuador:", CONFIG.SWITCH_ACTUADOR);
print("- Combinació secreta: LLARG-CURT-CURT-CURT-LLARG-CURT");
print("- Timeout combinació: 5 segons");
print("========================================");


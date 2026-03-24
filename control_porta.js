/**
 * Script de control de porta amb botó i llum verda per Shelly
 *
 * Configuració:
 * - Input 0 (S1): Sensor porta (detecta si està oberta/tancada)
 * - Input 1 (S2): Botó per obrir porta
 * - Switch 0: Llum verda (controlada manualment)
 * - Switch 1: Actuador obertura porta
 *
 * Funcionament:
 * - Quan es prem el botó (S2) i la llum verda està encesa, s'obre la porta
 * - La porta només s'obre si està tancada
 * - Quan es detecta que la porta s'ha obert (S1), es desactiva l'actuador
 */

// Configuració dels IDs dels components
let CONFIG = {
  INPUT_PORTA: 0,        // S1 - Sensor estat porta
  INPUT_BOTO: 1,         // S2 - Botó client
  SWITCH_LLUM_VERDA: 1,  // Llum verda (control manual) - Switch 1
  SWITCH_ACTUADOR: 0     // Actuador obertura porta - Switch 0
};

// Variable per controlar l'estat
let portaObrint = false;

/**
 * Comprova si la llum verda està encesa
 */
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

/**
 * Comprova si la porta està tancada
 */
function portaTancada(callback) {
  Shelly.call(
    "Input.GetStatus",
    { id: CONFIG.INPUT_PORTA },
    function(result, error_code, error_message) {
      if (error_code !== 0) {
        print("Error obtenint estat porta:", error_message);
        callback(false);
        return;
      }
      // Si state és false, la porta està tancada
      callback(result.state === false);
    }
  );
}

/**
 * Activa l'actuador per obrir la porta
 */
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
      portaObrint = true;
    }
  );
}

/**
 * Desactiva l'actuador
 */
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
      portaObrint = false;
    }
  );
}

/**
 * Processa la pulsació del botó
 */
function processarPulsacioBoto() {
  print("Botó premut - verificant condicions...");

  // Primer comprova si la llum verda està encesa
  llumVerdaEncesa(function(encesa) {
    if (!encesa) {
      print("Llum verda apagada - accés denegat");
      return;
    }

    print("Llum verda encesa - verificant estat porta...");

    // Comprova si la porta està tancada
    portaTancada(function(tancada) {
      if (!tancada) {
        print("La porta ja està oberta o obrint-se");
        return;
      }

      print("Condicions complides - obrint porta");
      activarActuador();
    });
  });
}

/**
 * Gestor d'esdeveniments principal
 */
Shelly.addEventHandler(function(event) {
  print("Event rebut:", JSON.stringify(event));

  // Detecta quan es prem el botó (S2)
  if (event.component === "input:" + CONFIG.INPUT_BOTO) {
    print("Event del botó detectat!");
    if (event.info.event === "single_push" || event.info.event === "btn_down") {
      print("Tipus event correcte:", event.info.event);
      processarPulsacioBoto();
    }
  }

  // Detecta quan la porta s'obre (S1 canvia d'estat)
  if (event.component === "input:" + CONFIG.INPUT_PORTA) {
    if (event.info.state === true && portaObrint) {
      print("Porta oberta detectada - desactivant actuador");
      desactivarActuador();
    }
  }
});

// Exposar funció HTTP per webhook
HTTPServer.registerEndpoint("button_pressed", function(request, response) {
  print("Webhook rebut - botó premut!");
  processarPulsacioBoto();
  response.code = 200;
  response.body = "OK";
  response.send();
});

print("Script de control de porta inicialitzat");
print("- Input porta:", CONFIG.INPUT_PORTA);
print("- Input botó:", CONFIG.INPUT_BOTO);
print("- Switch llum verda:", CONFIG.SWITCH_LLUM_VERDA);
print("- Switch actuador:", CONFIG.SWITCH_ACTUADOR);

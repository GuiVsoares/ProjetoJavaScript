let $player = $('#player');
let $gameArea = $('#game-area');
let efeito = document.getElementById('efeito');
let velocidadePlayer = 15; 
let playerSize = 40;
let fase = 1;

let fases = [
  { moedas: 5, obstaculos: 2 },
  { moedas: 7, obstaculos: 3 },
  { moedas: 10, obstaculos: 5 }
];


let obstaculosVelocidades = [];

let keysPressionadas = {};

function mostrarMensagem(texto) {
  $('#mensagem').text(texto).fadeIn(300);
  setTimeout(() => {
    $('#mensagem').fadeOut(500);
  }, 2000);
}

function colisao(a, b) {
  let aPos = a[0].getBoundingClientRect();
  let bPos = b[0].getBoundingClientRect();
  return !(
    aPos.right < bPos.left ||
    aPos.left > bPos.right ||
    aPos.bottom < bPos.top ||
    aPos.top > bPos.bottom
  );
}

function criarElementos(config) {
  $('.coin, .obstacle').remove();
  obstaculosVelocidades = [];

  let moedasPos = [];

  
  for (let i = 0; i < config.moedas; i++) {
    let coin = $('<div class="coin"></div>');
    let pos = gerarPosicaoAleatoria(moedasPos.concat([{top: 0, left: 0}]), 40);
    moedasPos.push(pos);
    coin.css({
      top: pos.top,
      left: pos.left
    });
    $gameArea.append(coin);
  }

 
  for (let i = 0; i < config.obstaculos; i++) {
    let pos;
    do {
      pos = gerarPosicaoAleatoria(moedasPos.concat([{top: 0, left: 0}]), 40);
    } while (posicaoOverlap(pos, moedasPos, 40) || (pos.top === 0 && pos.left === 0));

    let obs = $('<div class="obstacle"></div>');
    obs.css({
      top: pos.top,
      left: pos.left
    });
    $gameArea.append(obs);

 
    let dx = (Math.random() * 4 - 2) * 1.2;
    let dy = (Math.random() * 4 - 2) * 1.2;
    if (dx === 0) dx = 1.2;
    if (dy === 0) dy = 1.2;
    obstaculosVelocidades.push({ dx, dy });
  }

  $('#fase').text(fase);
}


function gerarPosicaoAleatoria(proibidos, tamanho) {
  const maxTop = $gameArea.height() - tamanho;
  const maxLeft = $gameArea.width() - tamanho;

  let top, left, seguro;

  do {
    top = Math.floor(Math.random() * maxTop);
    left = Math.floor(Math.random() * maxLeft);
    seguro = true;

    for (let p of proibidos) {
      if (Math.abs(p.top - top) < tamanho && Math.abs(p.left - left) < tamanho) {
        seguro = false;
        break;
      }
    }
  } while (!seguro);

  return { top, left };
}


function posicaoOverlap(pos, lista, tamanho) {
  for (let p of lista) {
    if (Math.abs(p.top - pos.top) < tamanho && Math.abs(p.left - pos.left) < tamanho) {
      return true;
    }
  }
  return false;
}


function atualizarObstaculos() {
  let obstáculos = $('.obstacle');

  obstáculos.each(function (index) {
    let $obs = $(this);
    let pos = $obs.position();
    let dx = obstaculosVelocidades[index].dx;
    let dy = obstaculosVelocidades[index].dy;

    let novoLeft = pos.left + dx;
    let novoTop = pos.top + dy;

    let maxLeft = $gameArea.width() - $obs.width();
    let maxTop = $gameArea.height() - $obs.height();

    if (novoLeft < 0 || novoLeft > maxLeft) {
      obstaculosVelocidades[index].dx = -dx;
      novoLeft = Math.max(0, Math.min(maxLeft, novoLeft));
    }
    if (novoTop < 0 || novoTop > maxTop) {
      obstaculosVelocidades[index].dy = -dy;
      novoTop = Math.max(0, Math.min(maxTop, novoTop));
    }

    $obs.css({ left: novoLeft, top: novoTop });
  });


  for (let i = 0; i < obstáculos.length; i++) {
    for (let j = i + 1; j < obstáculos.length; j++) {
      let obsA = $(obstáculos[i]);
      let obsB = $(obstáculos[j]);
      if (colisao(obsA, obsB)) {
        obstaculosVelocidades[i].dx = -obstaculosVelocidades[i].dx;
        obstaculosVelocidades[i].dy = -obstaculosVelocidades[i].dy;
        obstaculosVelocidades[j].dx = -obstaculosVelocidades[j].dx;
        obstaculosVelocidades[j].dy = -obstaculosVelocidades[j].dy;
      }
    }
  }
}

function checarMoedas() {
  $('.coin').each(function () {
    let coin = $(this);
    if (colisao($player, coin)) {
      coin.remove();
      if ($('.coin').length === 0) {
        fase++;
        if (fase > fases.length) {
          efeito.play();
          mostrarMensagem('🏆 Você venceu todas as fases!');
          fase = 1;
        } else {
          mostrarMensagem('✅ Fase concluída!');
        }
        criarElementos(fases[fase - 1]);
        $player.css({ top: 0, left: 0 });
      }
    }
  });
}

function checarObstaculos() {
  $('.obstacle').each(function () {
    let obs = $(this);
    if (colisao($player, obs)) {
      efeito.play();
      mostrarMensagem('💥 Você colidiu! Reiniciando fase.');
      criarElementos(fases[fase - 1]);
      $player.css({ top: 0, left: 0 });
    }
  });
}

function criarParticulas(x, y) {
  for (let i = 0; i < 5; i++) {
    const $p = $('<div class="particle"></div>');
    $p.css({
      top: y + Math.random() * 10 - 5,
      left: x + Math.random() * 10 - 5
    });
    $gameArea.append($p);
    setTimeout(() => $p.remove(), 500);
  }
}

$(document).keydown(function (e) {
  keysPressionadas[e.which] = true;
});

$(document).keyup(function (e) {
  delete keysPressionadas[e.which];
});

function moverPlayer() {
  let pos = $player.position();
  let novoTop = pos.top;
  let novoLeft = pos.left;
  let maxTop = $gameArea.height() - playerSize;
  let maxLeft = $gameArea.width() - playerSize;
  let moved = false;

  if (keysPressionadas[37]) {
    novoLeft = Math.max(0, novoLeft - velocidadePlayer);
    moved = true;
  }
  if (keysPressionadas[38]) { 
    novoTop = Math.max(0, novoTop - velocidadePlayer);
    moved = true;
  }
  if (keysPressionadas[39]) { 
    novoLeft = Math.min(maxLeft, novoLeft + velocidadePlayer);
    moved = true;
  }
  if (keysPressionadas[40]) { 
    novoTop = Math.min(maxTop, novoTop + velocidadePlayer);
    moved = true;
  }

  if (moved) {
    $player.css({ top: novoTop, left: novoLeft });
    criarParticulas(novoLeft + playerSize / 2, novoTop + playerSize / 2);
    checarMoedas();
    checarObstaculos();
  }
}


setInterval(() => {
  moverPlayer();
  atualizarObstaculos();
  checarObstaculos();
}, 30);

$('#btnJogar').click(function () {
  $('#menu').fadeOut(500, function () {
    $('#hud, #game-area').fadeIn(500);
    $player.css({ top: 0, left: 0 });
    criarElementos(fases[0]);
  });
});

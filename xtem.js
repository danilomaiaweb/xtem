const { exec } = require('child_process');
const robot = require('robotjs');
const sleep = require('sleep');
const fs = require('fs');
var colors = require('colors');
const path = require('path');
const speech = require('@google-cloud/speech');

let linhaAtual = 0; // Variável para controlar a linha atual do arquivo clientes.txt

// Função para abrir o aplicativo MicroSIP e fazer a ligação inicial
function abrirMicroSIP() {
  console.log('DEIXE O DISCADOR ABERTO NA TELA...'.green);
  const comando = '"C:\\Users\\celso\\AppData\\Local\\MicroSIP\\microsip.exe"';

  sleep.sleep(1);

  exec(comando, (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao abrir o MicroSIP: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no comando: ${stderr}`);
      return;
    }
    console.log('MicroSIP aberto com sucesso');
    sleep.sleep(1);

    // Verifica se há clientes a serem consultados
    const data = fs.readFileSync('clientes.txt', 'utf8').trim();
    const linhas = data.split('\n');
    const totalLinhas = linhas.length;
	
    if (totalLinhas === 0) {
      console.log('Lista de clientes vazia. Encerrando Chamada e Discador...'.yellow);
      sleep.sleep(2);
      robot.keyTap('enter');
	        robot.keyTap('escape');
      return;
    }
    fazerChamada('085981819055');
  });
}

// Função para fazer uma chamada usando o MicroSIP
function fazerChamada(numeroDestino) {
  console.log(`Efetuando ligação para ${numeroDestino}...`.red);

  // Digita o número de destino e pressiona a tecla Enter para fazer a chamada
  robot.typeString(numeroDestino);
  robot.keyTap('enter');

  console.log(`Chamada para ${numeroDestino} iniciada com sucesso`.green);

  // Aguarda um tempo para a URA falar as opções
  sleep.sleep(6);

  // Digita a opção desejada (no caso, a opção 3)
  robot.keyTap('3');

  // Aguarda mais 5 segundos
  sleep.sleep(3);

  // Ler o arquivo clientes.txt
  try {
    const data = fs.readFileSync('clientes.txt', 'utf8').trim();
    const linhas = data.split('\n');
    const totalLinhas = linhas.length;
	
  if (totalLinhas <= 0) {
    console.log('Lista de clientes vazia. Encerrando Chamada e Discador...'.yellow);
    sleep.sleep(2);
    robot.keyTap('enter');
	      robot.keyTap('escape');
    return;
  }
	
  if (linhaAtual < linhas.length) {
    const linhaDados = linhas[linhaAtual].split(':');
    if (linhaDados.length >= 3) {
      const [cpf, senha, cod] = linhaDados.map((item) => item.trim());
	  
        // Digita o CPF
        console.log(`Digitando CPF ${cpf}`.green);
        robot.typeString(cpf);

        // Aguarda 4 segundos
        sleep.sleep(3);

        // Digita a senha
        console.log(`Digitando Nascimento ${senha}`.green);
        robot.typeString(senha);
      console.log(`Preparando nova Chamada`.yellow);
	  
        // Finalizando Chamada	  
      sleep.sleep(2);
      robot.keyTap('enter');
      sleep.sleep(1);	  
	  robot.keyTap('escape');
      console.log(`Chamada Encerrada`.yellow);
      console.log(`Discador Minimizado`.yellow);
      console.log(`====================================`.yellow);

        // Incrementa a linha atual para a próxima chamada
        linhaAtual++;

        // Verifica se todas as chamadas foram concluídas
        if (linhaAtual === totalLinhas) {
          console.log('Todas as chamadas foram concluídas. Encerrando Chamada e Discador...'.green);
          sleep.sleep(2);
          robot.keyTap('enter');
		  robot.keyTap('escape');
          return;
        }
		
// INICIO CHAMA O ARQUIVO LOGIN TROCAR NUMERO

        console.log('ALTERANDO NUMERO'.yellow);
        robot.keyTap('escape');
        exec('node novo-login-ob.js', (error, stdout, stderr) => {
          if (error) {
            console.error(`Erro ao chamar o arquivo login.js: ${error.message}`);
            return;
          }
          if (stderr) {
            console.error(`Erro no comando do arquivo login.js: ${stderr}`);
            return;
          }
          console.log('N U M E R O   A L T E R A D O   C O M   S U C E S S O.'.green);

          // Faz a próxima chamada
          abrirMicroSIP(numeroDestino);
        });

// FINAL CHAMA O ARQUIVO LOGIN TROCAR NUMERO				

////////////////////////////////////////////////////////////////////

// INICIO CHAMA O ARQUI DA TRANSCRIÇÃO DO AUDIO
 
 // Carregue as credenciais do arquivo JSON
const keyFilename = './credenciais.json'; // Substitua pelo caminho correto do arquivo JSON
const credentials = require(keyFilename);

// Verifique se o arquivo JSON de credenciais contém o campo client_email
if (!credentials.client_email) {
  console.error('O arquivo JSON de credenciais não contém o campo client_email.');
  return;
}

// Obtenha o nome do arquivo de áudio da pasta "audios"
const audioPath = '';
const audioFolder = 'audios';
const audioFiles = fs.readdirSync(audioFolder);
const audioFile = audioFiles.find(file => file.endsWith('.wav'));

if (!audioFile) {
  console.error('Nenhum arquivo de áudio encontrado na pasta "audios".');
  return;
}

const wav = require('node-wav');
const audioFilePath = `${audioFolder}/${audioFile}`;

// Ler o cabeçalho do arquivo WAV para obter a taxa de amostragem
const wavData = fs.readFileSync(audioFilePath);
const { sampleRate } = wav.decode(wavData);

// Crie um cliente de reconhecimento de fala com as credenciais
const client = new speech.SpeechClient({ credentials });

// Atualizar a configuração com a taxa de amostragem detectada
const config = {
  encoding: 'LINEAR16',
  sampleRateHertz: sampleRate, // Atualize a taxa de amostragem conforme o valor correto do áudio WAV
  languageCode: 'pt-BR',
};

// Carregue o áudio a ser transcrito
const audio = {
  content: fs.readFileSync(`${audioFolder}/${audioFile}`).toString('base64'),
};
console.log('ANALISANDO AUDIO...'.green);
// Crie uma solicitação de reconhecimento de fala
const request = {
  config: config,
  audio: audio,
};

// Faça a transcrição do áudio
client
  .recognize(request)
  .then(response => {
    const transcription = response[0].results
      .map(result => result.alternatives[0].transcript)
      .join('\n');

// Gravar a transcrição no arquivo de transcrições (adicionando ao arquivo)
// Formato da linha: Cliente CPF <CPF> - Transcrição
const formattedTranscription = `Cliente CPF ${cpf} - ${transcription.toLowerCase().replace(/\n/g, '')}`;
fs.appendFileSync('transcrições.txt', formattedTranscription + '\n');
    console.log('Transcrição salva com sucesso em "transcrições.txt".'.green);
 
// Verificar se a transcrição contém a frase "Limite Maximo de Consultas Atingido"
if (transcription.toLowerCase().includes('limite máximo de consulta atingido')) {
      // Gravar no arquivo limite_atingido.txt
      fs.appendFileSync('limite_atingido.txt', transcription.trim() + '\n');
      console.log('Transcrição com limite atingido salva em "limite_atingido.txt".');
    }

// Verificar se a transcrição contém a frase "Não ha parcelas disponiveis"
if (transcription.toLowerCase().includes('não há parcelas disponíveis')) {
  // Gravar no arquivo sem_parcelas.txt
  fs.appendFileSync('sem_parcelas.txt', transcription.trim() + '\n');
      console.log('Transcrição sem parcelas disponíveis salva em "sem_parcelas.txt".');  
  
    }
	
    // Deletar o arquivo de áudio
    fs.unlinkSync(audioFilePath);
    console.log('Arquivo de áudio deletado com sucesso.'.green);
 	
  })
  .catch(err => {
    console.error('Erro:', err);
  });

 
// FINAL CHAMA O ARQUI DA TRANSCRIÇÃO DO AUDIO
 
          // Faz a próxima chamada
          abrirMicroSIP(numeroDestino);
        });
      }
    }
  } catch (error) {
    console.error(`Erro ao ler o arquivo clientes.txt: ${error.message}`);
  }
}

console.log(colors.green(`

██╗     ██╗ ██████╗  █████╗ ██████╗  ██████╗ ██████╗     ██╗  ██╗████████╗███████╗███╗   ███╗
██║     ██║██╔════╝ ██╔══██╗██╔══██╗██╔═══██╗██╔══██╗    ╚██╗██╔╝╚══██╔══╝██╔════╝████╗ ████║
██║     ██║██║  ███╗███████║██║  ██║██║   ██║██████╔╝     ╚███╔╝    ██║   █████╗  ██╔████╔██║
██║     ██║██║   ██║██╔══██║██║  ██║██║   ██║██╔══██╗     ██╔██╗    ██║   ██╔══╝  ██║╚██╔╝██║
███████╗██║╚██████╔╝██║  ██║██████╔╝╚██████╔╝██║  ██║    ██╔╝ ██╗   ██║   ███████╗██║ ╚═╝ ██║
╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝    ╚═╝  ╚═╝   ╚═╝   ╚══════╝╚═╝     ╚═╝
                                                                                             
                                                                                                          
 `))
  console.log(`=============================================`.green)
  console.log('LIGADOR XTEM KELVIN - ATUALIZADO EM: 11/07/2023')
  console.log(`=============================================`.green)
  
  
try {
  const data = fs.readFileSync('clientes.txt', 'utf8').trim();
  const linhas = data.split('\n');
  const totalLinhas = linhas.length;
  console.log(`Total de CPF ${totalLinhas}`.yellow);
} catch (error) {
  console.error(`Erro ao ler o arquivo clientes.txt: ${error.message}`);
}


// Iniciar a rotina
abrirMicroSIP();

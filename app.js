// ================= CONFIGURAÇÃO DO SUPABASE =================
const SUPABASE_URL = "https://yyfylclheivnlltquxxi.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_LGHmaDsFwChQkHl8neOsMg_BsgRBhvV"; 
// =============================================================

const VERSAO_ATUAL_APP = 101;

async function verificarAtualizacaoAutomatica() {
  try {
    let res = await fetch(`${SUPABASE_URL}/rest/v1/app_versao?id=eq.1&select=*`, {
      method: 'GET',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
      }
    });
    let dados = await res.json();
    if (dados && dados.length > 0) {
      let versaoRemota = dados[0];
      if (versaoRemota.version_code > VERSAO_ATUAL_APP) {
        let mensagem = `🔥 Nova versão disponível (${versaoRemota.version_name})!\n\nNovidades:\n${versaoRemota.changelog}\n\nDeseja baixar e atualizar agora?`;
        if (confirm(mensagem)) {
          window.location.href = versaoRemota.apk_url;
        }
      }
    }
  } catch (e) {
    console.error("Erro ao verificar atualização:", e);
  }
}

const STORAGE_KEY = 'cbmpe_tracker_v2';
const META_KEY = 'cbmpe_meta_v2';
const TEORIA_KEY = 'cbmpe_teoria_v2';
const Q_KEY = 'cbmpe_questoes_v2';
const CADERNO_ACERTOS_KEY = 'cbmpe_caderno_acertos_v2';
const CADERNO_ERROS_KEY = 'cbmpe_caderno_erros_v2';
const CICLOS_KEY = 'cbmpe_historico_ciclos_v1';
const DATAS_CICLO_KEY = 'cbmpe_datas_ciclo_v1';
const TEMPOS_TOPICOS_KEY = 'cbmpe_tempos_topicos_v1';
const DATAS_TOPICOS_KEY = 'cbmpe_datas_topicos_v1';

const STREAK_KEY = 'cbmpe_streak_v1';
let streakData = JSON.parse(localStorage.getItem(STREAK_KEY)) || { count: 0, lastDate: '' };

function getPatente(acertos) {
    if(acertos < 50) return { nome: "Soldado", icon: "🎖️" };
    if(acertos < 150) return { nome: "Cabo", icon: "🎗️" };
    if(acertos < 300) return { nome: "3º Sargento", icon: "🥉" };
    if(acertos < 500) return { nome: "2º Sargento", icon: "🥈" };
    if(acertos < 750) return { nome: "1º Sargento", icon: "🥇" };
    if(acertos < 1000) return { nome: "Subtenente", icon: "⚔️" };
    if(acertos < 1500) return { nome: "2º Tenente", icon: "⭐" };
    if(acertos < 2000) return { nome: "1º Tenente", icon: "⭐⭐" };
    if(acertos < 3000) return { nome: "Capitão", icon: "⭐⭐⭐" };
    if(acertos < 4500) return { nome: "Major", icon: "⚜️" };
    if(acertos < 6000) return { nome: "Tenente-Coronel", icon: "🦅" };
    return { nome: "Coronel", icon: "👑" };
}

function checkAndUpdateStreak() {
    let today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    let todayStr = today.toISOString().split('T')[0];

    if (streakData.lastDate === todayStr) return;

    if (!streakData.lastDate) {
        streakData.count = 1;
    } else {
        let last = new Date(streakData.lastDate);
        last.setMinutes(last.getMinutes() - last.getTimezoneOffset());
        let diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) streakData.count++;
        else if (diffDays > 1) streakData.count = 1;
    }
    streakData.lastDate = todayStr;
    localStorage.setItem(STREAK_KEY, JSON.stringify(streakData));
}


let MEU_ID_USUARIO = localStorage.getItem('cbmpe_meu_id') || '';
let CURSO_ATUAL = localStorage.getItem('cbmpe_curso_atual') || '';

let progress = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let customMeta = JSON.parse(localStorage.getItem(META_KEY)) || {};
let DB_TEORIA = JSON.parse(localStorage.getItem(TEORIA_KEY)) || {};



let cadernoAcertos = JSON.parse(localStorage.getItem(CADERNO_ACERTOS_KEY)) || [];
let cadernoErros = JSON.parse(localStorage.getItem(CADERNO_ERROS_KEY)) || [];
let historicoCiclos = JSON.parse(localStorage.getItem(CICLOS_KEY)) || [];
let cicloAtualNum = localStorage.getItem('cbmpe_ciclo_atual_num') ? parseInt(localStorage.getItem('cbmpe_ciclo_atual_num')) : 1;
let datasCiclo = JSON.parse(localStorage.getItem(DATAS_CICLO_KEY)) || {};
let temposTopicos = JSON.parse(localStorage.getItem(TEMPOS_TOPICOS_KEY)) || {};
let datasTopicos = JSON.parse(localStorage.getItem(DATAS_TOPICOS_KEY)) || {};

let EDITAL_CBMPE = JSON.parse(localStorage.getItem('cbmpe_cache_v1')) || [
  { id: 1, dia: 1, disc: "Língua Portuguesa", topico: "Compreensão e Interpretação de Textos + Tipologias Textuais", meta: 10, equivalente_id: "pt_interpretacao" },
  { id: 2, dia: 1, disc: "Física", topico: "Grandezas Físicas, Vetores e Cinemática Escalar e Vetorial", meta: 10, equivalente_id: "fis_mecanica_cinematica" },
  { id: 3, dia: 1, disc: "Física", topico: "Leis de Newton, Atrito, Força Resultante e Movimento Circular", meta: 10, equivalente_id: "fis_leis_newton_atrito" },
  { id: 4, dia: 1, disc: "Química", topico: "Estrutura Atômica, Tabela Periódica e Ligações Químicas", meta: 10, equivalente_id: "qui_estrutura_atomica" },
  { id: 5, dia: 1, disc: "Química", topico: "Óxidos, Ácidos, Bases e Sais + Nomenclatura e Funções Inorgânicas", meta: 10, equivalente_id: "qui_funcoes_inorganicas" },
  { id: 6, dia: 1, disc: "Biologia", topico: "Citologia: Membrana Plasmática, Citoplasma e Fisiologia Celular", meta: 10, equivalente_id: "bio_citologia" },
  { id: 7, dia: 1, disc: "Biologia", topico: "Divisão Celular (Mitose e Meiose) + Metabolismo Celular", meta: 10, equivalente_id: "bio_divisao_celular" },
  { id: 8, dia: 1, disc: "Matemática", topico: "Conjuntos Numéricos, Razão, Proporção, Porcentagem e Juros", meta: 10, equivalente_id: "mat_razao_proporcao" },
  { id: 9, dia: 1, disc: "Estatística", topico: "Conceitos Iniciais, População, Censo e Amostragem Aleatória", meta: 10 },
  { id: 10, dia: 1, disc: "Informática", topico: "Internet, Intranet, Navegadores e Computação em Nuvem", meta: 10 },
  { id: 11, dia: 1, disc: "Direito Constitucional", topico: "Teoria da Constituição: Conceito, Classificação e Elementos", meta: 10, equivalente_id: "dir_const_teoria" },
  { id: 12, dia: 2, disc: "Língua Portuguesa", topico: "Sintaxe do Período Simples (Termos Essenciais, Integrantes e Acessórios)", meta: 10 },
  { id: 13, dia: 2, disc: "Língua Portuguesa", topico: "Funções Morfossintáticas das Partículas 'Se' e 'Que'", meta: 10, equivalente_id: "pt_particulas_se_que" },
  { id: 14, dia: 2, disc: "Física", topico: "Trabalho, Energia Cinética, Energia Potencial e Potência", meta: 10, equivalente_id: "fis_trabalho_energia" },
  { id: 15, dia: 2, disc: "Física", topico: "Conservação e Dissipação de Energia Mecânica", meta: 10, equivalente_id: "fis_conservacao_energia" },
  { id: 16, dia: 2, disc: "Química", topico: "Estados da Matéria, Gases Ideais e Princípio de Avogadro", meta: 10 },
  { id: 17, dia: 2, disc: "Química", topico: "Soluções: Molaridade, Fração Molar, Concentração e Diluição", meta: 10, equivalente_id: "qui_solucoes" },
  { id: 18, dia: 2, disc: "Biologia", topico: "Bioquímica Celular, Fotossíntese e Respiração Celular", meta: 10 },
  { id: 19, dia: 2, disc: "Biologia", topico: "Codificação Genética, Síntese Proteica e Diferenciação Celular", meta: 10 },
  { id: 20, dia: 2, disc: "Matemática", topico: "Funções Algébricas do 1º e 2º Graus + Gráficos e Inequações", meta: 10 },
  { id: 21, dia: 2, disc: "Estatística", topico: "Descrição Numérica de Dados: Médias, Moda e Mediana", meta: 10 },
  { id: 22, dia: 2, disc: "Direito Constitucional", topico: "Poder Constituinte: Originário, Derivado, Difuso e Mutações", meta: 10 },
  { id: 23, dia: 3, disc: "Língua Portuguesa", topico: "Sintaxe do Período Composto: Coordenação e Subordinação", meta: 10 },
  { id: 24, dia: 3, disc: "Língua Portuguesa", topico: "Mecanismos de Coesão Textual e Relações Semânticas", meta: 10, equivalente_id: "pt_coesao" },
  { id: 25, dia: 3, disc: "Física", topico: "Quantidade de Movimento (Momento Linear), Impulso e Colisões", meta: 10 },
  { id: 26, dia: 3, disc: "Física", topico: "Centro de Massa, Torque e Equilíbrio Estático de Ponto e Corpo Rígido", meta: 10 },
  { id: 27, dia: 3, disc: "Química", topico: "Reações Químicas: Classificação, Rendimento e Balanceamento", meta: 10, equivalente_id: "qui_reacoes" },
  { id: 28, dia: 3, disc: "Química", topico: "Estequiometria e Cálculos Estequiométricos de Reações", meta: 10 },
  { id: 29, dia: 3, disc: "Biologia", topico: "Histologia Animal e Vegetal: Principais Tecidos e Funções", meta: 10 },
  { id: 30, dia: 3, disc: "Biologia", topico: "Biotecnologia, Células-Tronco, DNA Recombinante e Clonagem", meta: 10 },
  { id: 31, dia: 3, disc: "Matemática", topico: "Funções Polinomiais, Racionais, Exponenciais e Logarítmicas", meta: 10 },
  { id: 32, dia: 3, disc: "Informática", topico: "Segurança da Informação: Ameaças, Malware, Phishing e Criptografia", meta: 10, equivalente_id: "info_seguranca" },
  { id: 33, dia: 3, disc: "Direito Constitucional", topico: "Eficácia e Aplicabilidade das Normas Constitucionais", meta: 10 },
  { id: 34, dia: 4, disc: "Língua Portuguesa", topico: "Concordância Nominal e Concordância Verbal", meta: 10, equivalente_id: "pt_concordancia" },
  { id: 35, dia: 4, disc: "Língua Portuguesa", topico: "Regência Nominal e Verbal + Emprego do Sinal da Crase", meta: 10 },
  { id: 36, dia: 4, disc: "Física", topico: "Hidrostática: Princípios de Stevin, Pascal e Arquimedes (Empuxo)", meta: 10, equivalente_id: "fis_hidrostatica" },
  { id: 37, dia: 4, disc: "Física", topico: "Gravitação Universal, Leis de Kepler e Marés", meta: 10 },
  { id: 38, dia: 4, disc: "Química", topico: "Termoquímica: Calor de Reação, Entalpia e Combustão", meta: 10, equivalente_id: "qui_termoquimica" },
  { id: 39, dia: 4, disc: "Química", topico: "Cinética Química: Energia de Ativação, Velocidade e Catalisadores", meta: 10, equivalente_id: "qui_cinetica" },
  { id: 40, dia: 4, disc: "Biologia", topico: "Fisiologia Humana: Sistemas Circulatório, Respiratório e Digestório", meta: 10, equivalente_id: "bio_fisiologia_cardio_resp" },
  { id: 41, dia: 4, disc: "Biologia", topico: "Fisiologia Humana: Sistemas Nervoso, Endócrino e Excretor", meta: 10, equivalente_id: "bio_fisiologia_nervoso" },
  { id: 42, dia: 4, disc: "Matemática", topico: "Geometria Plana: Ângulos, Triângulos, Teorema de Tales e Áreas", meta: 10 },
  { id: 43, dia: 4, disc: "Estatística", topico: "Medidas de Dispersão (Variância, Desvio-Padrão) e Boxplot", meta: 10 },
  { id: 44, dia: 4, disc: "Direito Constitucional", topico: "Direitos e Garantias Individuais e Coletivos (Art. 5º da CF)", meta: 10, equivalente_id: "dir_const_art5" },
  { id: 45, dia: 5, disc: "Língua Portuguesa", topico: "Pontuação e Suas Funções Semânticas no Texto", meta: 10, equivalente_id: "pt_pontuacao" },
  { id: 46, dia: 5, disc: "Língua Portuguesa", topico: "Colocação Pronominal, Ortografia Oficial e Acentuação", meta: 10 },
  { id: 47, dia: 5, disc: "Física", topico: "Termologia: Calorimetria, Escalas e Dilatação Térmica", meta: 10, equivalente_id: "fis_termologia" },
  { id: 48, dia: 5, disc: "Física", topico: "Leis da Termodinâmica, Ciclo de Carnot e Máquinas Térmicas", meta: 10, equivalente_id: "fis_termodinamica" },
  { id: 49, dia: 5, disc: "Química", topico: "Equilíbrio Químico e Iônico: Le Chatelier, pH, pOH e Solução Tampão", meta: 10, equivalente_id: "qui_equilibrio" },
  { id: 50, dia: 5, disc: "Química", topico: "Reações Redox, Pilhas, Potencial Eletroquímico e Eletrólise", meta: 10 },
  { id: 51, dia: 5, disc: "Biologia", topico: "Ecologia: Ecossistemas, Cadeia/Teia Alimentar e Dinâmica de Populações", meta: 10 },
  { id: 52, dia: 5, disc: "Biologia", topico: "Ciclos Biogeoquímicos, Biomas Brasileiros e Serviços Ecossistêmicos", meta: 10 },
  { id: 53, dia: 5, disc: "Matemática", topico: "Geometria Espacial: Prismas, Cilindros, Pirâmides, Cones e Volumes", meta: 10 },
  { id: 54, dia: 5, disc: "Informática", topico: "Windows 11, Prompt de Comando e Pacotes Office/LibreOffice", meta: 10, equivalente_id: "info_office" },
  { id: 55, dia: 5, disc: "Direito Constitucional", topico: "Remédios Constitucionais, Direitos Sociais, Nacionalidade e Políticos", meta: 10 },
  { id: 56, dia: 6, disc: "Língua Estrangeira (Inglês)", topico: "Interpretação de Textos e Vocabulário Técnico", meta: 10 },
  { id: 57, dia: 6, disc: "Língua Estrangeira (Inglês)", topico: "Estruturas Gramaticais: Tempos Verbais, Modais e Voz Passiva", meta: 10 },
  { id: 58, dia: 6, disc: "Física", topico: "Fenômenos Elétricos: Campo, Potencial, Lei de Ohm, Circuitos e Joule", meta: 10, equivalente_id: "fis_eletrodinamica" },
  { id: 59, dia: 6, disc: "Física", topico: "Fenômenos Magnéticos, Ondulatória e Óptica Geométrica", meta: 10, equivalente_id: "fis_ondulatoria_optica" },
  { id: 60, dia: 6, disc: "Química", topico: "Química Orgânica: Funções, Nomenclatura e Isomeria", meta: 10 },
  { id: 61, dia: 6, disc: "Química", topico: "Aspectos Químicos do Fogo, Combustão, Produtos Químicos e FDS", meta: 10 },
  { id: 62, dia: 6, disc: "Biologia", topico: "Problemas Ambientais, Saúde Pública/ISTs e Primeiros Socorros", meta: 10 },
  { id: 63, dia: 6, disc: "Matemática", topico: "Trigonometria, Análise Combinatória e Noções de Probabilidade", meta: 10 },
  { id: 64, dia: 6, disc: "Estatística", topico: "Variáveis Aleatórias, Distribuições, Testes t/F e Regressão Linear", meta: 10 },
  { id: 65, dia: 6, disc: "Informática", topico: "Armazenamento de Dados, Tipos de Backup e Restauração", meta: 10 },
  { id: 66, dia: 6, disc: "Direito Constitucional", topico: "Organização do Estado, Poderes e Controle de Constitucionalidade", meta: 10 },
  { id: 70, dia: 1, disc: "D. Administrativo", topico: "Estado, Governo, Organização Administrativa e Princípios", meta: 10, equivalente_id: "dir_adm_org" },
  { id: 71, dia: 1, disc: "D. Penal Militar", topico: "Aplicação da Lei, Teoria do Crime e Imputabilidade", meta: 10, equivalente_id: "dir_pm_crime" },
  { id: 72, dia: 2, disc: "D. Administrativo", topico: "Agentes Públicos e Regime Jurídico Único", meta: 10 },
  { id: 73, dia: 2, disc: "D. Constitucional", topico: "Defesa do Estado e Instituições Democráticas (Ordem Social)", meta: 10, equivalente_id: "dir_const_defesa" },
  { id: 74, dia: 3, disc: "D. Administrativo", topico: "Poderes Administrativos e Ato Administrativo", meta: 10, equivalente_id: "dir_adm_poderes_atos" },
  { id: 75, dia: 3, disc: "D. Penal Militar", topico: "Concurso de Agentes, Penas e Medidas de Segurança", meta: 10, equivalente_id: "dir_pm_penas" },
  { id: 76, dia: 4, disc: "D. Administrativo", topico: "Serviços Públicos e Controle da Administração (Responsabilidade Civil)", meta: 10, equivalente_id: "dir_adm_resp" },
  { id: 77, dia: 4, disc: "Legislação CBMPE", topico: "Lei Orgânica Nacional (14.751/23) e LOB CBMPE (Lei 15.187/13)", meta: 10 },
  { id: 78, dia: 5, disc: "D. Constitucional", topico: "Constituição de PE, Súmulas e Legislação (ECA, Juventude e Maria da Penha)", meta: 10 },
  { id: 79, dia: 5, disc: "Legislação CBMPE", topico: "Estatuto dos Militares do Estado de Pernambuco (Lei 6.783/74)", meta: 10 },
  { id: 80, dia: 6, disc: "D. Penal Militar", topico: "Ação Penal, Extinção e Crimes Militares (Paz e Guerra)", meta: 10, equivalente_id: "dir_pm_crimes_especie" },
  { id: 81, dia: 6, disc: "Legislação CBMPE", topico: "Código Disciplinar (Lei 11.817/00) e Decreto 50.014/20", meta: 10 },
  { id: 67, dia: 7, disc: "Redação Discursiva", topico: "Discursiva Operacional (20 a 30 linhas) - Tema BM", meta: 1, equivalente_id: "redacao_bm" },
  { id: 68, dia: 7, disc: "Buffer / Atrasos", topico: "Reposição de questões/tópicos pendentes da semana", meta: 0, equivalente_id: "buffer_semanal" },
  { id: 69, dia: 7, disc: "Caderno de Erros", topico: "Refazer questões erradas marcadas com 'Precisa Revisar'", meta: 0, equivalente_id: "caderno_erros_semana" }
];

let EDITAL_CBMGO = JSON.parse(localStorage.getItem('cbmgo_cache_v1')) || [
  { id: 101, dia: 1, disc: "Noções de Física", topico: "Mecânica: 1ª e 2ª Leis + Atrito e Força Resultante", meta: 10, equivalente_id: "fis_leis_newton_atrito" },
  { id: 102, dia: 1, disc: "Noções de Química", topico: "Reações Químicas + Reatividade de Óxidos e Metais", meta: 10, equivalente_id: "qui_reacoes" },
  { id: 103, dia: 1, disc: "Noções de Biologia", topico: "Anatomia do Trauma: Esqueleto Apendicular e Membros", meta: 10 },
  { id: 104, dia: 1, disc: "Atividade BM", topico: "Teoria do Fogo / Tetraedro + Fases do Incêndio Urbano", meta: 10 },
  { id: 105, dia: 1, disc: "D. Administrativo", topico: "Processo Administrativo (Lei Estadual nº 13.800/01)", meta: 10 },
  { id: 106, dia: 1, disc: "Raciocínio Lógico", topico: "Matemática Proporcional, Razão, Proporção e Percentual", meta: 10, equivalente_id: "mat_razao_proporcao" },
  { id: 107, dia: 1, disc: "D. Penal Militar", topico: "Teoria do Crime Militar e Tipicidade", meta: 10 },
  { id: 108, dia: 1, disc: "D. Constitucional", topico: "Estado de Defesa e Segurança Pública (Art. 136 da CF)", meta: 10 },
  { id: 109, dia: 1, disc: "Língua Portuguesa", topico: "Sintaxe e Funções das Partículas \"Se\" e \"Que\"", meta: 10, equivalente_id: "pt_particulas_se_que" },
  { id: 110, dia: 1, disc: "Realidade de Goiás", topico: "Economia Colonial e Mineração no Século XVIII", meta: 10 },
  { id: 111, dia: 1, disc: "Informática", topico: "Segurança Cibernética, Golpes Digitais e Phishing", meta: 10, equivalente_id: "info_seguranca" },
  { id: 112, dia: 2, disc: "Noções de Física", topico: "Eletrodinâmica: Efeito Joule, Potência e Curto-Circuito", meta: 10, equivalente_id: "fis_eletrodinamica" },
  { id: 113, dia: 2, disc: "Noções de Química", topico: "Soluções: Molaridade + Partes por Milhão (PPM) e Dureza", meta: 10, equivalente_id: "qui_solucoes" },
  { id: 114, dia: 2, disc: "Noções de Biologia", topico: "Fisiologia Cardiovascular: Dinâmica de Câmaras Cardíacas", meta: 10, equivalente_id: "bio_fisiologia_cardio_resp" },
  { id: 115, dia: 2, disc: "Atividade BM", topico: "Métodos de Extinção + Classes de Incêndio (A, B, C, D, K)", meta: 10 },
  { id: 116, dia: 2, disc: "D. Administrativo", topico: "Estrutura Administrativa e Entidades Públicas", meta: 10 },
  { id: 117, dia: 2, disc: "Raciocínio Lógico", topico: "Lógica Proposicional, Negação e Quantificadores", meta: 10 },
  { id: 118, dia: 2, disc: "D. Penal Militar", topico: "Penas Principais e Penas Acessórias no CPM", meta: 10 },
  { id: 119, dia: 2, disc: "D. Constitucional", topico: "Repartição de Competências Legislativas (Art. 22 CF)", meta: 10 },
  { id: 120, dia: 2, disc: "Língua Portuguesa", topico: "Coesão Textual e Elementos de Transição (Conectivos)", meta: 10, equivalente_id: "pt_coesao" },
  { id: 121, dia: 2, disc: "Realidade de Goiás", topico: "Expansão Capitalista e Modernização Pós-1930 / Marcha Oeste", meta: 10 },
  { id: 122, dia: 2, disc: "Informática", topico: "Pacote Office: Mala Direta, Word e Excel", meta: 10, equivalente_id: "info_office" },
  { id: 123, dia: 3, disc: "Noções de Física", topico: "Termologia: Calor Sensível, Hipotermia e Condução/Fourier", meta: 10, equivalente_id: "fis_termologia" },
  { id: 124, dia: 3, disc: "Noções de Química", topico: "Funções Inorgânicas: Força Ácida, Bases e Sais", meta: 10, equivalente_id: "qui_funcoes_inorganicas" },
  { id: 125, dia: 3, disc: "Noções de Biologia", topico: "Sistema Cardiovascular Especializado (Artérias, Veias e Porta)", meta: 10 },
  { id: 126, dia: 3, disc: "Atividade BM", topico: "Suporte Básico de Vida (SBV) + Extintores e Agentes", meta: 10 },
  { id: 127, dia: 3, disc: "D. Administrativo", topico: "Responsabilidade Civil do Estado (Art. 37, §6º da CF)", meta: 10 },
  { id: 128, dia: 3, disc: "Raciocínio Lógico", topico: "Teoria dos Conjuntos e Diagramas de Venn", meta: 10 },
  { id: 129, dia: 3, disc: "Proc. Penal Mil.", topico: "Inquérito Policial Militar (IPM): Prazos e Delegação", meta: 10 },
  { id: 130, dia: 3, disc: "D. Constitucional", topico: "Constituição de Goiás: Normas Militares e Bombeiros", meta: 10 },
  { id: 131, dia: 3, disc: "Língua Portuguesa", topico: "Semântica Verbal, Modos/Tempos e Emprego da Vírgula", meta: 10, equivalente_id: "pt_pontuacao" },
  { id: 132, dia: 3, disc: "Realidade de Goiás", topico: "Diversidade Étnica e Povos Indígenas de Goiás", meta: 10 },
  { id: 133, dia: 3, disc: "Informática", topico: "Arquitetura de Computadores e Periféricos (Entrada/Saída)", meta: 10 },
  { id: 134, dia: 4, disc: "Noções de Física", topico: "Cinemática do Trauma + Hidrostática (Pascal e Arquimedes)", meta: 10, equivalente_id: "fis_hidrostatica" },
  { id: 135, dia: 4, disc: "Noções de Química", topico: "Termoquímica (Combustão) + Estequiometria (Comburente)", meta: 10, equivalente_id: "qui_termoquimica" },
  { id: 136, dia: 4, disc: "Noções de Biologia", topico: "Fisiologia Respiratória e Asfixia (Trocas Gasosas, CO, Cianeto)", meta: 10 },
  { id: 137, dia: 4, disc: "Legislação CBMGO", topico: "Fenômenos Térmicos + Código Contra Incêndio CTRCON", meta: 10 },
  { id: 138, dia: 4, disc: "D. Administrativo", topico: "Atos Administrativos + Poderes (Vinculado, Discricionário, Polícia)", meta: 10 },
  { id: 139, dia: 4, disc: "Raciocínio Lógico", topico: "Tabela-Verdade, Condicionais e Leis de De Morgan", meta: 10 },
  { id: 140, dia: 4, disc: "D. Penal Militar", topico: "Crimes Militares em Espécie (Desobediência, Motim, etc.)", meta: 10 },
  { id: 141, dia: 4, disc: "D. Constitucional", topico: "Segurança Pública: Art. 144 da CF e o CBM", meta: 10 },
  { id: 142, dia: 4, disc: "Língua Portuguesa", topico: "Concordância Verbal/Nominal e Regência/Crase", meta: 10, equivalente_id: "pt_concordancia" },
  { id: 143, dia: 4, disc: "Realidade de Goiás", topico: "Geografia Física: Relevo, Bacias Hidrográficas e Cerrado", meta: 10 },
  { id: 144, dia: 4, disc: "Informática", topico: "Redes de Computadores, Protocolos (TCP/IP, HTTPS) e Browsers", meta: 10 },
  { id: 145, dia: 5, disc: "Noções de Física", topico: "Termodinâmica (Gases/Trabalho) + Dinâmica Rotacional/Estática", meta: 10, equivalente_id: "fis_termodinamica" },
  { id: 146, dia: 5, disc: "Noções de Química", topico: "Cinética Química + Funções Orgânicas e Combustíveis", meta: 10, equivalente_id: "qui_cinetica" },
  { id: 147, dia: 5, disc: "Noções de Biologia", topico: "Fisiologia do Sistema Nervoso: Escala de Glasgow e Trauma", meta: 10, equivalente_id: "bio_fisiologia_nervoso" },
  { id: 148, dia: 5, disc: "Legislação CBMGO", topico: "Estatuto dos Militares: Conselho de Justificação, Férias e Promoções", meta: 10 },
  { id: 149, dia: 5, disc: "D. Administrativo", topico: "Nova Lei de Licitações (Lei nº 14.133/21)", meta: 10 },
  { id: 150, dia: 5, disc: "Raciocínio Lógico", topico: "Análise Combinatória: Permutação, Arranjo e Combinação", meta: 10 },
  { id: 151, dia: 5, disc: "Proc. Penal Mil.", topico: "Prisão em Flagrante Delito Militar e Auto de Prisão", meta: 10 },
  { id: 152, dia: 5, disc: "D. Constitucional", topico: "Direitos e Garantias Fundamentais (Art. 5º da CF)", meta: 10, equivalente_id: "dir_const_art5" },
  { id: 153, dia: 5, disc: "Língua Portuguesa", topico: "Reforço: Conectivos, Conjunções e Interpretação Textual", meta: 10, equivalente_id: "pt_coesao" },
  { id: 154, dia: 5, disc: "Realidade de Goiás", topico: "Patrimônio Cultural, Folclore (Cavalhadas, Fogaréu) e Tradições", meta: 10 },
  { id: 155, dia: 5, disc: "Informática", topico: "Sistemas Operacionais: Windows 10 e 11 + Gestão de Pastas", meta: 10, equivalente_id: "info_office" },
  { id: 156, dia: 6, disc: "Noções de Física", topico: "Ondulatória (Doppler) + Óptica Geométrica e Gravitação", meta: 10, equivalente_id: "fis_ondulatoria_optica" },
  { id: 157, dia: 6, disc: "Noções de Química", topico: "Equilíbrio Químico (Le Chatelier) + Radioatividade (Alfa, Beta, Gama)", meta: 10, equivalente_id: "qui_equilibrio" },
  { id: 158, dia: 6, disc: "Noções de Biologia", topico: "Citologia, Bioquímica Celular e Genética Básica", meta: 10, equivalente_id: "bio_citologia" },
  { id: 159, dia: 6, disc: "Legislação CBMGO", topico: "Código de Ética e Disciplina + LOB CBMGO (Lei nº 18.305/13)", meta: 10 },
  { id: 160, dia: 6, disc: "D. Administrativo", topico: "Improbidade Administrativa (Lei 8.429/92) + Bens e Serviços", meta: 10 },
  { id: 161, dia: 6, disc: "Raciocínio Lógico", topico: "Probabilidade Simples e Condicional", meta: 10 },
  { id: 162, dia: 6, disc: "Proc. Penal Mil.", topico: "Medidas Preventivas e Assecuratórias no CPPM", meta: 10 },
  { id: 163, dia: 6, disc: "D. Constitucional", topico: "Organização dos Poderes + Funções Essenciais à Justiça", meta: 10 },
  { id: 164, dia: 6, disc: "Língua Portuguesa", topico: "Reforço: Partículas Se/Que + Sintaxe e Pontuação Geral", meta: 10, equivalente_id: "pt_particulas_se_que" },
  { id: 165, dia: 6, disc: "Realidade de Goiás", topico: "Reforço: Agropecuária Moderna, Urbanização e Economia Atual", meta: 10 },
  { id: 166, dia: 6, disc: "D. Ambiental", topico: "Lei de Crimes Ambientais (Lei 9.605/98) e Queimadas/Flora", meta: 10 },
  { id: 67, dia: 7, disc: "Redação Discursiva", topico: "Discursiva Operacional (20 a 30 linhas) - Tema BM", meta: 1, equivalente_id: "redacao_bm" },
  { id: 68, dia: 7, disc: "Buffer / Atrasos", topico: "Reposição de questões/tópicos pendentes da semana", meta: 0, equivalente_id: "buffer_semanal" },
  { id: 69, dia: 7, disc: "Caderno de Erros", topico: "Refazer questões erradas marcadas com 'Precisa Revisar'", meta: 0, equivalente_id: "caderno_erros_semana" }
];

let EDITAL_ALL = [];

const SUBJECTS_META = [
  { disc: "Língua Portuguesa", icon: "📚", label: "Língua Portuguesa" },
  { disc: "Física", icon: "⚛️", label: "Física" },
  { disc: "Noções de Física", icon: "⚛️", label: "Noções de Física" },
  { disc: "Química", icon: "🧪", label: "Química" },
  { disc: "Noções de Química", icon: "🧪", label: "Noções de Química" },
  { disc: "Biologia", icon: "🧬", label: "Biologia" },
  { disc: "Noções de Biologia", icon: "🧬", label: "Noções de Biologia" },
  { disc: "Matemática", icon: "📐", label: "Matemática" },
  { disc: "Estatística", icon: "📊", label: "Estatística" },
  { disc: "Informática", icon: "💻", label: "Informática" },
  { disc: "Direito Constitucional", icon: "⚖️", label: "Direito Constitucional" },
  { disc: "D. Constitucional", icon: "⚖️", label: "D. Constitucional" },
  { disc: "Língua Estrangeira (Inglês)", icon: "🇺🇸", label: "Inglês" },
  { disc: "Atividade BM", icon: "🚒", label: "Atividade BM" },
  { disc: "D. Administrativo", icon: "🏛️", label: "D. Administrativo" },
  { disc: "Raciocínio Lógico", icon: "🧠", label: "Raciocínio Lógico" },
  { disc: "D. Penal Militar", icon: "⚔️", label: "D. Penal Militar" },
  { disc: "Realidade de Goiás", icon: "🗺️", label: "Realidade de Goiás" },
  { disc: "Proc. Penal Mil.", icon: "⚖️", label: "Proc. Penal Militar" },
  { disc: "Legislação CBMGO", icon: "📜", label: "Legislação CBMGO" },
  { disc: "Legislação CBMPE", icon: "📜", label: "Legislação CBMPE" },
  { disc: "D. Ambiental", icon: "🌲", label: "Direito Ambiental" },
  { disc: "Redação Discursiva", icon: "✍️", label: "Redação" },
  { disc: "Buffer / Atrasos", icon: "⏳", label: "Buffer" },
  { disc: "Caderno de Erros", icon: "📖", label: "Erros" }
];

const DAY_TITLES_CBMPE = {
  1: "Dia 1 — Base Geral & Exatas I",
  2: "Dia 2 — Sintaxe, Energia, Soluções & Poder Constituinte",
  3: "Dia 3 — Período Composto, Colisões, Estequiometria & Segurança",
  4: "Dia 4 — Concordância, Crase, Hidrostática, Termoquímica & Art. 5º",
  5: "Dia 5 — Pontuação, Termodinâmica, Eletroquímica, Ecologia & Remédios",
  6: "Dia 6 — Inglês, Eletricidade, Química do Fogo, Probabilidade & Poderes",
  7: "Dia 7 — Redação Operacional BM, Buffer & Caderno de Erros"
};

const DAY_TITLES_CBMGO = {
  1: "Dia 1 — Física, Química, Biologia, Penal Mil., Constitucional & Atualidades",
  2: "Dia 2 — Eletrodinâmica, Soluções, Fisiologia e Lógica",
  3: "Dia 3 — Termologia, Funções Inorgânicas, IPM e Língua Portuguesa",
  4: "Dia 4 — Hidrostática, Termoquímica, CBMGO e Regência",
  5: "Dia 5 — Termodinâmica, Licitações, Flagrante e Estatuto",
  6: "Dia 6 — Ondulatória, Equilíbrio Químico, CPPM e Meio Ambiente",
  7: "Dia 7 — Redação Operacional BM, Buffer & Caderno de Erros"
};

let DAY_TITLES = {};

function carregarEdital() {
  EDITAL_ALL = CURSO_ATUAL === 'CBMGO' ? EDITAL_CBMGO : EDITAL_CBMPE;
  DAY_TITLES = CURSO_ATUAL === 'CBMGO' ? DAY_TITLES_CBMGO : DAY_TITLES_CBMPE;
  
  EDITAL_ALL.forEach(item => {
    if (customMeta[item.id] !== undefined) item.meta = customMeta[item.id];
  });

  let headerTitle = document.getElementById('app-main-title');
  if(headerTitle) {
    headerTitle.innerText = CURSO_ATUAL === 'CBMGO' ? "🚒 CFO CBMGO — App" : "🚒 CFO CBMPE — App";
  }

  let badgeEl = document.getElementById('badge-concurso-ativo');
  if(badgeEl) {
    badgeEl.innerText = CURSO_ATUAL === 'CBMGO' ? "🎯 CFO CBMGO (Goiás)" : "🎯 CFO CBMPE (Pernambuco)";
  }
}

function selecionarTrilha(curso) {
  CURSO_ATUAL = curso;
  localStorage.setItem('cbmpe_curso_atual', CURSO_ATUAL);
  carregarEdital();
  document.getElementById('trilha-seletor-container').style.display = 'none';
  document.getElementById('trilha-conteudo-container').style.display = 'block';
  renderTrail();
  updateGlobalStats();
}

function voltarParaSeletorTrilha() {
  CURSO_ATUAL = '';
  localStorage.removeItem('cbmpe_curso_atual');
  document.getElementById('trilha-conteudo-container').style.display = 'none';
  document.getElementById('trilha-seletor-container').style.display = 'block';
}

let CURRENT_FILTER = { type: 'trilha', val: null };

function getP(id) {
  if (!progress[id]) progress[id] = { revisar: false, note: "" };
  return progress[id];
}

function calcularStatsSeguras(listaTopicos) {
    let idsBusca = new Set();
    let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
    
    listaTopicos.forEach(t => {
        idsBusca.add(t.id);
        if (t.equivalente_id) {
            poolEd.filter(e => e.equivalente_id === t.equivalente_id).forEach(e => idsBusca.add(e.id));
        }
    });

    let acertosMap = new Map();
    let errosMap = new Map();

    // DEDUPLICAÇÃO ABSOLUTA: Usamos o texto da questão (q) em vez do ID. 
    // Mata qualquer duplicação criada pelo Supabase.
    cadernoAcertos.forEach(q => {
        if (idsBusca.has(q.topico_id)) acertosMap.set(q.q ? q.q.trim() : q.id, q);
    });

    cadernoErros.forEach(q => {
        if (idsBusca.has(q.topico_id)) {
            let texto = q.q ? q.q.trim() : q.id;
            if (!acertosMap.has(texto)) errosMap.set(texto, q);
        }
    });

    return {
        feitas: acertosMap.size + errosMap.size,
        acertos: acertosMap.size,
        erros: errosMap.size
    };
}

function getTopicStats(topicoId) {
  let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let itemAtual = poolEd.find(e => e.id === topicoId);
  
  let idsParaBuscar = [topicoId];
  if (itemAtual && itemAtual.equivalente_id) {
    idsParaBuscar = poolEd
      .filter(e => e.equivalente_id === itemAtual.equivalente_id)
      .map(e => e.id);
  }

  let acertosMap = new Map();
  cadernoAcertos.filter(q => idsParaBuscar.includes(q.topico_id)).forEach(q => {
     acertosMap.set(q.q ? q.q.trim() : q.id, q);
  });

  let errosMap = new Map();
  cadernoErros.filter(q => idsParaBuscar.includes(q.topico_id)).forEach(q => {
     let texto = q.q ? q.q.trim() : q.id;
     if (!acertosMap.has(texto)) errosMap.set(texto, q);
  });

  let acertos = acertosMap.size;
  let erros = errosMap.size;
  let feitas = acertos + erros;
  let pct = feitas > 0 ? Math.round((acertos / feitas) * 100) : 0;
  
  return { feitas, acertos, erros, pct };
}

// ================= SUPABASE SYNC (GLOBAL + INDIVIDUAL + RANKING) =================
async function baixarDadosDaNuvem() {
  if (!MEU_ID_USUARIO) return;
  try {
    let resGlobal = await fetch(`${SUPABASE_URL}/rest/v1/app_conteudo?id=eq.global&select=dados`, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    let jsonGlobal = await resGlobal.json();
    if (jsonGlobal && jsonGlobal.length > 0 && jsonGlobal[0].dados) {
      let g = jsonGlobal[0].dados;
      if(g.questoes) DB_QUESTOES_ALL = g.questoes;
      if(g.teoria) DB_TEORIA = g.teoria;
      
      // Recebe os editais globais
      if(g.editais && Array.isArray(g.editais)) {
          editaisCustomizados = g.editais;
          localStorage.setItem(EDITAIS_CUSTOM_KEY, JSON.stringify(editaisCustomizados));
      }
    } else {
      await salvarConteudoGlobalNaNuvem();
    }

    let resIndiv = await fetch(`${SUPABASE_URL}/rest/v1/app_progresso?usuario_id=eq.${MEU_ID_USUARIO}&select=dados`, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    let jsonIndiv = await resIndiv.json();
    if (jsonIndiv && jsonIndiv.length > 0 && jsonIndiv[0].dados) {
      let p = jsonIndiv[0].dados;
      progress = p.progress || {};
      customMeta = p.customMeta || {};
      cadernoAcertos = p.cadernoAcertos || [];
      cadernoErros = p.cadernoErros || [];
      historicoCiclos = p.historicoCiclos || [];
      cicloAtualNum = p.cicloAtualNum || 1;
      datasCiclo = p.datasCiclo || {};
      temposTopicos = p.temposTopicos || {};
      datasTopicos = p.datasTopicos || {};
    } else {
      await salvarProgressoIndividualNaNuvem();
    }

    if(CURSO_ATUAL) carregarEdital();
    saveStateLocallyOnly();
    if(CURSO_ATUAL) renderTrail();
    updateGlobalStats();
    enviarPlacarParaRanking();
    
    // Força a exibição dos novos editais na tela de Seleção
    if(typeof renderizarBotoesEditais === 'function') renderizarBotoesEditais();

  } catch (e) {
    console.error("Erro ao sincronizar:", e);
  }
}

async function salvarConteudoGlobalNaNuvem() {
  try {
    // 1. Puxa os dados globais mais recentes da nuvem PRIMEIRO para não apagar o que os amigos fizeram
    let resGlobal = await fetch(`${SUPABASE_URL}/rest/v1/app_conteudo?id=eq.global&select=dados`, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    
    let jsonGlobal = await resGlobal.json();
    let dadosNuvem = (jsonGlobal && jsonGlobal.length > 0 && jsonGlobal[0].dados) ? jsonGlobal[0].dados : {};
    
    // 2. Mescla os editais da nuvem com os locais (se os amigos criaram editais novos)
    let editaisNuvem = dadosNuvem.editais || [];
    let mapEditais = new Map();
    
    // Junta tudo num mapa para evitar duplicação pelo ID
    editaisNuvem.forEach(e => mapEditais.set(e.id, e));
    editaisCustomizados.forEach(e => mapEditais.set(e.id, e));
    
    editaisCustomizados = Array.from(mapEditais.values());
    localStorage.setItem(EDITAIS_CUSTOM_KEY, JSON.stringify(editaisCustomizados));

    // 3. Prepara o pacote final para enviar
    let payload = { 
      id: 'global', 
      dados: { 
        questoes: DB_QUESTOES_ALL, 
        teoria: DB_TEORIA,
        editais: editaisCustomizados // Garante que os editais partilhados vão juntos
      }, 
      atualizado_em: new Date() 
    };
    
    // 4. Salva tudo em segurança
    await fetch(`${SUPABASE_URL}/rest/v1/app_conteudo`, {
      method: 'POST',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(payload)
    });
    
    // Renderiza os botões no menu inicial caso a nuvem tenha trazido algo novo
    if(typeof renderizarBotoesEditais === 'function') renderizarBotoesEditais();
    
  } catch (e) {
    console.error("Erro ao salvar conteúdo global na nuvem:", e);
  }
}
async function salvarProgressoIndividualNaNuvem() {
  if (!MEU_ID_USUARIO) return;
  let payload = { 
    usuario_id: MEU_ID_USUARIO, 
    dados: { progress, customMeta, cadernoAcertos, cadernoErros, historicoCiclos, cicloAtualNum, datasCiclo, temposTopicos, datasTopicos }, 
    atualizado_em: new Date() 
  };
  await fetch(`${SUPABASE_URL}/rest/v1/app_progresso`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
    body: JSON.stringify(payload)
  });
}

async function enviarPlacarParaRanking() {
  if (!MEU_ID_USUARIO) return;
  
  // Usamos a função segura para garantir que enviamos o valor sem duplicações
  let poolGeral = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let statsSeguras = calcularStatsSeguras(poolGeral);
  
  let totaisFeitas = statsSeguras.feitas;
  let totaisAcertos = statsSeguras.acertos;
  let pctGeral = totaisFeitas > 0 ? Math.round((totaisAcertos / totaisFeitas) * 100) : 0;

  let payload = {
    usuario_id: MEU_ID_USUARIO,
    nome: localStorage.getItem('cbmpe_nome_usuario') || MEU_ID_USUARIO,
    acertos: totaisAcertos,
    feitas: totaisFeitas,
    pct: pctGeral,
    detalhes_topicos: { cadernoAcertos, cadernoErros, temposTopicos, streakData },
    atualizado_em: new Date()
  };

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/app_ranking`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
  } catch (e) {
    console.error("Erro ao atualizar ranking:", e);
  }
}

async function renderizarRankingOnline() {
  let container = document.getElementById('content-ranking');
  if(!container) return;
  container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--ink-soft);">Carregando ranking ao vivo...</div>`;

  let selectFiltro = document.getElementById('filtro-ranking-edital');
  let editalFiltro = selectFiltro ? selectFiltro.value : 'GERAL';

  try {
    let res = await fetch(`${SUPABASE_URL}/rest/v1/app_ranking?select=*`, {
      method: 'GET',
      headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
    });
    let lista = await res.json();

    window._rankingCacheData = lista || [];

    if(!lista || lista.length === 0) {
      container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--ink-soft);">Nenhum usuário no ranking ainda.</div>`;
      return;
    }

    let listaFiltrada = lista.map(item => {
      let detalhes = item.detalhes_topicos || {};
      let acertosArr = detalhes.cadernoAcertos || [];
      let errosArr = detalhes.cadernoErros || [];

      let totalFeitas = 0, totalAcertos = 0;

      if (editalFiltro === 'GERAL') {
        // Ignoramos o número duplicado antigo do banco e contamos diretamente dos cadernos limpos!
        totalFeitas = acertosArr.length + errosArr.length;
        totalAcertos = acertosArr.length;
      } else {
        let idsValidos = editalFiltro === 'CBMPE' 
          ? Array.from({length: 81}, (_, i) => i + 1) 
          : Array.from({length: 67}, (_, i) => i + 101).concat([67, 68, 69]);

        let acertosFiltrados = acertosArr.filter(q => idsValidos.includes(q.topico_id));
        let errosFiltrados = errosArr.filter(q => idsValidos.includes(q.topico_id));
        
        totalFeitas = acertosFiltrados.length + errosFiltrados.length;
        totalAcertos = acertosFiltrados.length;
      }

      let pct = totalFeitas > 0 ? Math.round((totalAcertos / totalFeitas) * 100) : 0;

      return {
        ...item,
        acertos: totalAcertos,
        feitas: totalFeitas,
        pct: pct
      };
    });

    listaFiltrada.sort((a, b) => b.acertos - a.acertos || b.pct - a.pct);

    let html = `
      <div class="topic-card">
        <p style="font-size:13px;color:var(--ink-soft);margin-bottom:16px;">Exibindo placar para: <b>${editalFiltro === 'GERAL' ? 'Todos os Editais (Geral)' : 'CFO ' + editalFiltro}</b>. Clique em qualquer usuário para ver detalhes.</p>
        <div style="display:flex;flex-direction:column;gap:8px;">
    `;

    listaFiltrada.forEach((item, index) => {
      let medalha = index === 0 ? '🥇' : (index === 1 ? '🥈' : (index === 2 ? '🥉' : `<b>#${index+1}</b>`));
      let isEu = item.usuario_id === MEU_ID_USUARIO;
      let bgCard = isEu ? 'var(--mnemo-bg)' : 'var(--card-bg2)';
      let borderColor = isEu ? 'var(--brass)' : 'var(--line)';
      let patenteInfo = getPatente(item.acertos);
      let userStreak = (item.detalhes_topicos && item.detalhes_topicos.streakData) ? item.detalhes_topicos.streakData.count : 0;

      html += `
        <div onclick="abrirDetalhesUsuarioRanking('${item.usuario_id}')" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:${bgCard};border:1px solid ${borderColor};border-radius:8px;cursor:pointer;transition:transform .1s;" title="Clique para ver detalhes">
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:18px;width:28px;text-align:center;">${medalha}</span>
            <div>
              <div style="font-weight:700;font-size:14.5px;color:var(--brass-2);">${item.nome} ${isEu ? '(Você)' : ''} 🔍</div>
              <div style="font-size:11px;font-family:var(--mono);color:var(--ink-soft);">${patenteInfo.icon} ${patenteInfo.nome} • ${item.feitas} feitas</div>
            </div>
          </div>
          <div style="text-align:right;">
            <div style="font-family:var(--serif);font-size:18px;font-weight:bold;color:var(--brass-2);">${item.acertos} acertos</div>
            <div style="font-size:11.5px;font-family:var(--mono);color:var(--green);">${item.pct}% taxa <span style="color:#ff8c00;margin-left:4px;font-weight:bold;">🔥 ${userStreak}d</span></div>
          </div>
        </div>
      `;
    });

    html += `</div></div>`;
    container.innerHTML = html;
  } catch(e) {
    container.innerHTML = `<div style="text-align:center;padding:20px;color:var(--red);">Erro ao carregar o ranking.</div>`;
  }
}

function abrirDetalhesUsuarioRanking(usuarioId) {
  let dadosUsuario = (window._rankingCacheData || []).find(u => u.usuario_id === usuarioId);
  if(!dadosUsuario) return;

  let detalhes = dadosUsuario.detalhes_topicos || {};
  let acertosArr = detalhes.cadernoAcertos || [];
  let errosArr = detalhes.cadernoErros || [];
  let userStreak = detalhes.streakData ? detalhes.streakData.count : 0;
  let patenteInfo = getPatente(dadosUsuario.acertos);

  let todas = [...acertosArr, ...errosArr].sort((a,b) => (b.timestamp || 0) - (a.timestamp || 0));
  let ultimas5 = todas.slice(0, 5);

  let htmlConteudo = `
    <div style="background:var(--card-bg2); border-radius:8px; padding:16px; margin-bottom:16px; text-align:center; border:1px solid var(--brass);">
        <div style="font-size:40px; margin-bottom:8px;">${patenteInfo.icon}</div>
        <h4 style="margin:0; color:var(--brass-2); font-family:var(--serif); font-size:20px;">${patenteInfo.nome}</h4>
        <div style="font-family:var(--mono); font-size:13px; color:var(--ink-soft); margin-top:4px;">🔥 Hot Streak: ${userStreak} dias seguidos</div>
        <div style="margin-top:10px; font-size:14px;"><b>${dadosUsuario.nome}</b> tem ${dadosUsuario.acertos} acertos (${dadosUsuario.pct}% de precisão).</div>
    </div>
  `;

  htmlConteudo += `<h4 style="color:var(--brass-2); font-family:var(--serif); border-bottom:1px solid var(--line); padding-bottom:6px; margin-bottom:12px;">🕵️ Últimas Interações (Radar)</h4>`;
  
  if(ultimas5.length === 0) {
      htmlConteudo += `<div style="color:var(--ink-soft); text-align:center; padding:10px;">Nenhum rastro recente encontrado.</div>`;
  } else {
      htmlConteudo += `<div style="display:flex; flex-direction:column; gap:10px;">`;
      ultimas5.forEach(q => {
          let isAcerto = acertosArr.some(a => a.id === q.id);
          let motivo = q.motivo || 'desconhecido';
          let badgeCor = isAcerto ? 'var(--green)' : 'var(--red)';
          let statusTexto = isAcerto ? 'ACERTOU' : 'ERROU';
          htmlConteudo += `
            <div style="background:var(--card-bg); border-left:4px solid ${badgeCor}; padding:10px 12px; border-radius:6px; border-top:1px solid var(--line); border-right:1px solid var(--line); border-bottom:1px solid var(--line);">
                <div style="display:flex; justify-content:space-between; margin-bottom:6px;">
                    <span style="font-weight:bold; font-size:12px; color:${badgeCor};">${statusTexto}</span>
                    <span style="font-size:11px; font-family:var(--mono); color:var(--ink-soft);">Nível ${q.nivel || 2}</span>
                </div>
                <div style="font-size:13px; margin-bottom:6px;">${q.materia}</div>
                <div style="font-size:11px; color:var(--ink-soft); font-family:var(--mono);">Motivo: <b>${motivo.toUpperCase()}</b></div>
            </div>
          `;
      });
      htmlConteudo += `</div>`;
  }

  document.getElementById('rank-detalhes-titulo').innerText = `Dossiê: ${dadosUsuario.nome}`;
  document.getElementById('rank-detalhes-conteudo').innerHTML = htmlConteudo;
  document.getElementById('modal-ranking-detalhes').style.display = 'flex';
}

function fecharModalRankingDetalhes() { document.getElementById('modal-ranking-detalhes').style.display = 'none'; }
function formatarTempo(segundos) { let m = Math.floor(segundos / 60); let s = segundos % 60; return `${m}m ${s < 10 ? '0' : ''}${s}s`; }

let _syncTimerGlobal = null;
let _syncTimerIndiv = null;

function saveState() {
  saveStateLocallyOnly();

  clearTimeout(_syncTimerGlobal);
  _syncTimerGlobal = setTimeout(() => { salvarConteudoGlobalNaNuvem(); }, 1500);

  clearTimeout(_syncTimerIndiv);
  _syncTimerIndiv = setTimeout(() => { 
    salvarProgressoIndividualNaNuvem(); 
    enviarPlacarParaRanking();
  }, 1500);
}

function saveStateLocallyOnly() {
  // O truque do reverse() garante que a versão MAIS RECENTE da questão é a que sobrevive!
  cadernoAcertos = Array.from(new Map([...cadernoAcertos].reverse().map(item => [item.id || item.q, item])).values()).reverse();
  cadernoErros = Array.from(new Map([...cadernoErros].reverse().map(item => [item.id || item.q, item])).values()).reverse();
  
  checkAndUpdateStreak();
  // ... resto do teu código continua igual para baixo
  
  let hojeStr = new Date().toISOString().split('T')[0];
  let poolGeral = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  poolGeral.forEach(item => {
    let stats = getTopicStats(item.id);
    if (stats.feitas > 0) {
      if (!datasTopicos[item.id]) {
        datasTopicos[item.id] = { start: hojeStr, ciclo: cicloAtualNum };
      }
      if (item.meta > 0 && stats.feitas >= item.meta && !datasTopicos[item.id].end) {
        datasTopicos[item.id].end = hojeStr;
      }
      if (item.meta > 0 && stats.feitas < item.meta && datasTopicos[item.id].end) {
        delete datasTopicos[item.id].end;
      }
    }
  });

  localStorage.setItem(DATAS_TOPICOS_KEY, JSON.stringify(datasTopicos));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  localStorage.setItem(META_KEY, JSON.stringify(customMeta));
  localStorage.setItem(CADERNO_ACERTOS_KEY, JSON.stringify(cadernoAcertos));
  localStorage.setItem(CADERNO_ERROS_KEY, JSON.stringify(cadernoErros));
  localStorage.setItem(Q_KEY, JSON.stringify(DB_QUESTOES_ALL));
  localStorage.setItem(TEORIA_KEY, JSON.stringify(DB_TEORIA));
  localStorage.setItem(CICLOS_KEY, JSON.stringify(historicoCiclos));
  localStorage.setItem('cbmpe_ciclo_atual_num', cicloAtualNum);
  localStorage.setItem(DATAS_CICLO_KEY, JSON.stringify(datasCiclo));
  localStorage.setItem(TEMPOS_TOPICOS_KEY, JSON.stringify(temposTopicos));
  
  updateGlobalStats();
  if (CURRENT_FILTER.type === 'dia' || CURRENT_FILTER.type === 'disc') renderFilteredTopics();
  else if (CURRENT_FILTER.type === 'trilha' && CURSO_ATUAL) renderTrail();
  else if (CURRENT_FILTER.type === 'materias') renderMateriasGrid();
  else if (CURRENT_FILTER.type === 'revisao') renderRev();
  else if (CURRENT_FILTER.type === 'relatorio') renderRel();
  else if (CURRENT_FILTER.type === 'cadernos') renderCadernoTab(currentCadernoTab);
  else if (CURRENT_FILTER.type === 'ranking') renderizarRankingOnline();
  else if (CURRENT_FILTER.type === 'calendario') renderCalendario();
}

// Recupera a lista de perfis salvos no navegador
function getPerfisSalvos() {
    let perfis = JSON.parse(localStorage.getItem('cbmpe_perfis_salvos')) || [];
    if (MEU_ID_USUARIO && !perfis.some(p => p.id === MEU_ID_USUARIO)) {
        let myName = localStorage.getItem('cbmpe_nome_usuario') || MEU_ID_USUARIO;
        perfis.push({ id: MEU_ID_USUARIO, nome: myName });
        localStorage.setItem('cbmpe_perfis_salvos', JSON.stringify(perfis));
    }
    return perfis;
}

function carregarDadosPerfil() {
  let myGeminiKey = localStorage.getItem('cbmpe_gemini_key') || '';
  let view = document.getElementById('view-perfil');
  let myName = localStorage.getItem('cbmpe_nome_usuario') || '';
  let myId = MEU_ID_USUARIO;
  
  let poolGeral = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let statsSeguras = calcularStatsSeguras(poolGeral);

  let totFeitas = statsSeguras.feitas;
  let totAcertos = statsSeguras.acertos;
  let pctGeral = totFeitas > 0 ? Math.round((totAcertos / totFeitas) * 100) : 0;
  
  let patenteInfo = getPatente(totAcertos);
  let streak = streakData.count;

  let perfis = getPerfisSalvos();
  let htmlPerfis = perfis.map(p => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg2); padding:12px; border-radius:8px; margin-bottom:10px; border:1px solid ${p.id === MEU_ID_USUARIO ? 'var(--brass)' : 'var(--line)'};">
          <div>
              <strong style="color:var(--fg); font-size:15px;">${p.nome}</strong> 
              <span style="font-size:11.5px; font-family:var(--mono); color:var(--ink-soft); display:block;">ID: @${p.id}</span>
          </div>
          <div style="display:flex; gap:6px;">
              ${p.id !== MEU_ID_USUARIO ? `<button class="btn btn-primary" style="padding:6px 12px; font-size:12px; background:var(--navy);" onclick="trocarPerfil('${p.id}')">🔄 Entrar</button>` : `<span class="pill" style="background:var(--brass);color:#fff;border-color:var(--brass);">Logado</span>`}
              <button class="btn btn-danger" style="padding:6px 12px; font-size:12px;" onclick="excluirPerfilPrompt('${p.id}')">🗑️ Sair</button>
          </div>
      </div>
  `).join('');

  view.innerHTML = `
    <div class="topic-card" style="text-align:center; padding:30px 20px; border-top:5px solid var(--brass);">
        <div style="font-size:60px; margin-bottom:10px;">${patenteInfo.icon}</div>
        <h2 style="font-family:var(--serif); margin:0 0 5px 0; color:var(--brass-2); font-size:26px;">${patenteInfo.nome}</h2>
        <div style="font-family:var(--mono); font-size:14px; color:var(--ink-soft); margin-bottom:20px;">🔥 Sequência Atual: ${streak} dias</div>
        
        <div style="display:flex; justify-content:center; gap:20px; margin-bottom:30px; flex-wrap:wrap;">
            <div style="background:var(--card-bg2); padding:15px; border-radius:8px; min-width:120px;">
                <div style="font-size:24px; font-weight:bold; color:var(--fg);">${totAcertos}</div>
                <div style="font-size:11px; font-family:var(--mono); color:var(--ink-soft); text-transform:uppercase;">Acertos Totais</div>
            </div>
            <div style="background:var(--card-bg2); padding:15px; border-radius:8px; min-width:120px;">
                <div style="font-size:24px; font-weight:bold; color:var(--green);">${pctGeral}%</div>
                <div style="font-size:11px; font-family:var(--mono); color:var(--ink-soft); text-transform:uppercase;">Precisão (Geral)</div>
            </div>
        </div>
        
        <div style="text-align:left; border-top:1px solid var(--line); padding-top:20px; margin-bottom:20px;">
            <h3 style="font-family:var(--serif); margin-top:0; color:var(--fg);">👥 Alternar Contas (Local)</h3>
            <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:16px;">Alterne entre utilizadores ou adicione uma nova conta neste dispositivo.</p>
            ${htmlPerfis}
            <button class="btn" style="width:100%; border-style:dashed; margin-top:8px; padding:12px;" onclick="document.getElementById('modal-login-inicial').style.display='flex'">➕ Adicionar Novo Perfil</button>
        </div>

        <div style="text-align:left; border-top:1px solid var(--line); padding-top:20px; margin-bottom:20px;">
            <h3 style="font-family:var(--serif); margin-top:0; color:var(--fg);">⚙️ Editar o Meu Perfil</h3>
            <div class="form-group" style="margin-top:14px;">
              <label>Nome / Apelido no Ranking:</label>
              <input type="text" id="input-meu-nome" class="form-control" value="${myName}" placeholder="Ex: SD Silva">
            </div>
            <div class="form-group">
              <label>ID Único (Supabase):</label>
              <input type="text" id="input-meu-id" class="form-control" value="${myId}" placeholder="ramiro">
            </div>
            <button class="btn btn-primary" style="width:100%;padding:12px;margin-top:10px;" onclick="salvarPerfilUsuario()">💾 Atualizar Dados do Perfil</button>
        </div>

<div class="form-group" style="margin-top:14px;">
              <label>Nome / Apelido no Ranking:</label>
              <input type="text" id="input-meu-nome" class="form-control" value="${myName}" placeholder="Ex: SD Silva">
            </div>
            <div class="form-group">
              <label>ID Único (Supabase):</label>
              <input type="text" id="input-meu-id" class="form-control" value="${myId}" placeholder="ramiro">
            </div>
            <div class="form-group">
              <label>🔑 Chave API do Gemini (Para gerar resumos e questões):</label>
              <input type="password" id="input-gemini-key" class="form-control" value="${myGeminiKey}" placeholder="AIzaSy...">
            </div>
            <button class="btn btn-primary" style="width:100%;padding:12px;margin-top:10px;" onclick="salvarPerfilUsuario()">💾 Atualizar Dados do Perfil</button>
</div>
        <!-- NOVO: ADMINISTRAÇÃO DA NUVEM -->
        <div style="text-align:left; border-top:1px solid var(--red); padding-top:20px; margin-top:20px; background:var(--red-bg); padding:16px; border-radius:8px;">
            <h3 style="font-family:var(--serif); margin-top:0; color:var(--red);">🚨 Administrador (Apagar Contas)</h3>
            <p style="font-size:12.5px; color:var(--ink-soft); margin-bottom:10px;">Vê todos os utilizadores da plataforma e apaga perfis da nuvem definitivamente.</p>
            <button class="btn btn-danger" style="width:100%; padding:10px;" onclick="carregarListaAdminNuvem()">📥 Ver Todos os Usuários da Nuvem</button>
            <div id="admin-lista-nuvem"></div>
        </div>
    </div>
  `;
}

// Lógica de alteração e exclusão de perfis
function trocarPerfil(novoId) {
    let perfis = getPerfisSalvos();
    let alvo = perfis.find(p => p.id === novoId);
    if(!alvo) return;
    
    // Salva o estado do usuário que está a sair
    saveStateLocallyOnly();
    salvarProgressoIndividualNaNuvem();

    // Troca as credenciais principais
    MEU_ID_USUARIO = alvo.id;
    localStorage.setItem('cbmpe_meu_id', MEU_ID_USUARIO);
    localStorage.setItem('cbmpe_nome_usuario', alvo.nome);
    
    // Limpa a memória RAM para forçar o download dos novos dados
    progress = {}; customMeta = {}; cadernoAcertos = []; cadernoErros = [];
    temposTopicos = {}; datasTopicos = {}; historicoCiclos = []; cicloAtualNum = 1;
    
    baixarDadosDaNuvem().then(() => {
        alert(`Bem-vindo de volta, ${alvo.nome}! Seus dados foram carregados.`);
        showMainView('perfil');
    });
}

function excluirPerfilPrompt(id) {
    let senha = prompt("⚠️ ATENÇÃO: Esta ação vai excluir o perfil localmente. Digite a senha numérica de 1 a 8 para confirmar a exclusão:");
    if(senha === "12345678") {
        let perfis = getPerfisSalvos();
        perfis = perfis.filter(p => p.id !== id);
        localStorage.setItem('cbmpe_perfis_salvos', JSON.stringify(perfis));
        
        if(id === MEU_ID_USUARIO) {
            alert("O perfil que você estava usando foi excluído. Faça login novamente.");
            localStorage.removeItem('cbmpe_meu_id');
            localStorage.removeItem('cbmpe_nome_usuario');
            MEU_ID_USUARIO = '';
            window.location.reload();
        } else {
            alert("Perfil secundário excluído com sucesso.");
            carregarDadosPerfil(); // Atualiza a tela sem recarregar
        }
    } else {
        if(senha !== null) alert("❌ Senha incorreta. Exclusão cancelada.");
    }
}

// Atualização da criação de contas para suportar múltiplos cadastros
function salvarConfigInicial() {
  let nome = document.getElementById('setup-input-nome').value.trim();
  let id = document.getElementById('setup-input-id').value.trim().toLowerCase().replace(/\s+/g, '_');
  if(!nome || !id) { alert("Por favor, preencha o seu nome e o ID único."); return; }

  // Se já havia um usuário logado, salva os dados dele na nuvem antes de criar/entrar no novo
  if(MEU_ID_USUARIO) {
      saveStateLocallyOnly();
      salvarProgressoIndividualNaNuvem();
  }

  localStorage.setItem('cbmpe_nome_usuario', nome);
  localStorage.setItem('cbmpe_meu_id', id);
  MEU_ID_USUARIO = id;

  // Registra no catálogo de contas salvas
  let perfis = JSON.parse(localStorage.getItem('cbmpe_perfis_salvos')) || [];
  if(!perfis.some(p => p.id === id)) {
      perfis.push({ id: id, nome: nome });
      localStorage.setItem('cbmpe_perfis_salvos', JSON.stringify(perfis));
  }

  document.getElementById('modal-login-inicial').style.display = 'none';
  document.getElementById('setup-input-nome').value = '';
  document.getElementById('setup-input-id').value = '';
  
  // Esvazia os dados locais para receber o histórico da nova conta
  progress = {}; customMeta = {}; cadernoAcertos = []; cadernoErros = [];
  temposTopicos = {}; datasTopicos = {}; historicoCiclos = []; cicloAtualNum = 1;
  
  baixarDadosDaNuvem().then(() => {
      if(document.getElementById('view-perfil').style.display === 'block') {
          carregarDadosPerfil();
      }
  });
}

function salvarConfigInicial() {
  let nome = document.getElementById('setup-input-nome').value.trim();
  let id = document.getElementById('setup-input-id').value.trim().toLowerCase().replace(/\s+/g, '_');
  if(!nome || !id) { alert("Por favor, preencha o seu nome e o ID único."); return; }

  localStorage.setItem('cbmpe_nome_usuario', nome);
  localStorage.setItem('cbmpe_meu_id', id);
  MEU_ID_USUARIO = id;

  document.getElementById('modal-login-inicial').style.display = 'none';
  baixarDadosDaNuvem();
}

function verificarPrimeiroAcesso() {
  if (!MEU_ID_USUARIO) {
    document.getElementById('modal-login-inicial').style.display = 'flex';
  } else {
    baixarDadosDaNuvem();
  }
}

function isQuestionArchived(qId) {
  return cadernoAcertos.some(x => x.id === qId) || cadernoErros.some(x => x.id === qId);
}

function obterTotaisSeguros(poolArray) {
  let idsValidos = new Set();
  
  // Recolhe os IDs do contexto atual e os seus equivalentes
  poolArray.forEach(item => {
    idsValidos.add(item.id);
    if(item.equivalente_id) {
      [...EDITAL_CBMPE, ...EDITAL_CBMGO]
        .filter(e => e.equivalente_id === item.equivalente_id)
        .forEach(e => idsValidos.add(e.id));
    }
  });

  // Conta usando Set para garantir que NENHUMA questão é contada em dobro
  let unicosAcertos = new Set();
  let unicosErros = new Set();
  
  cadernoAcertos.forEach(q => { if(idsValidos.has(q.topico_id)) unicosAcertos.add(q.id); });
  cadernoErros.forEach(q => { if(idsValidos.has(q.topico_id) && !unicosAcertos.has(q.id)) unicosErros.add(q.id); });
  
  return {
    feitas: unicosAcertos.size + unicosErros.size,
    acertos: unicosAcertos.size,
    erros: unicosErros.size
  };
}

function updateGlobalStats() {
  let totConc = 0, totTopicos = 0;
  // Utiliza estritamente o edital ativo, sem combinar arrays de outros concursos
  let poolAtivo = EDITAL_ALL; 

  poolAtivo.forEach(item => {
    if (item.dia <= 6) {
      totTopicos++;
      // A função getTopicStats já lida com os cruzamentos e retira os dados corretos
      let stats = getTopicStats(item.id);
      if (stats.feitas > 0 && (item.meta === 0 || stats.feitas >= item.meta)) {
          totConc++;
      }
    }
  });

  // Calcula estatísticas estritas para o pool do edital em visualização
  let statsSeguras = calcularStatsSeguras(poolAtivo.filter(x => x.dia <= 6));
  let pctGlobal = statsSeguras.feitas > 0 ? Math.round((statsSeguras.acertos / statsSeguras.feitas) * 100) : 0;
  
  document.getElementById('hub-pct').innerText = pctGlobal + '%';
  document.getElementById('hub-feitas').innerText = statsSeguras.feitas;
  document.getElementById('hub-topicos').innerText = `${totConc}/${totTopicos}`;
}
function hideAllViews() {
  if(document.getElementById('view-quiz') && document.getElementById('view-quiz').style.display === 'block') {
    if(quizTimerInterval) clearInterval(quizTimerInterval);
    if(quizTopicoIdAtual && quizTimerSeconds > 0) {
      temposTopicos[quizTopicoIdAtual] = (temposTopicos[quizTopicoIdAtual] || 0) + quizTimerSeconds;
      quizTimerSeconds = 0;
      saveState();
    }
  }

  ['view-trilha','view-materias','view-cadernos','view-topicos','view-backup','view-revisao','view-simulado','view-calendario','view-ranking','view-perfil','view-relatorio','view-quiz'].forEach(id => {
    let el = document.getElementById(id);
    if(el) el.style.display = 'none';
  });
  document.getElementById('content-topicos').innerHTML = '';
}

function showMainView(viewName) {
  hideAllViews();
  document.querySelectorAll('.nav-group .tab-btn').forEach(b => b.classList.remove('active'));
  const navBtn = document.getElementById('nav-' + viewName);
  if (navBtn) navBtn.classList.add('active');

  CURRENT_FILTER = { type: viewName, val: null };
  updateGlobalStats();

  if (viewName === 'trilha') { 
    document.getElementById('view-trilha').style.display = 'block'; 
    if(!CURSO_ATUAL) {
      document.getElementById('trilha-seletor-container').style.display = 'block';
      document.getElementById('trilha-conteudo-container').style.display = 'none';
    } else {
      document.getElementById('trilha-seletor-container').style.display = 'none';
      document.getElementById('trilha-conteudo-container').style.display = 'block';
      carregarEdital();
      renderTrail(); 
    }
  }
  else if (viewName === 'materias') { document.getElementById('view-materias').style.display = 'block'; renderMateriasGrid(); }
  else if (viewName === 'cadernos') { document.getElementById('view-cadernos').style.display = 'block'; renderCadernoTab('acertos'); }
  else if (viewName === 'backup') { document.getElementById('view-backup').style.display = 'block'; }
  else if (viewName === 'revisao') { document.getElementById('view-revisao').style.display = 'block'; renderRev(); }
  else if (viewName === 'simulado') { document.getElementById('view-simulado').style.display = 'block'; initSimuladoSetup(); }
  else if (viewName === 'calendario') { document.getElementById('view-calendario').style.display = 'block'; renderCalendario(); }
  else if (viewName === 'ranking') { document.getElementById('view-ranking').style.display = 'block'; renderizarRankingOnline(); }
  else if (viewName === 'perfil') { document.getElementById('view-perfil').style.display = 'block'; carregarDadosPerfil(); }
  else if (viewName === 'relatorio') { document.getElementById('view-relatorio').style.display = 'block'; renderRel(); }
  window.scrollTo(0, 0);
}

function importarBancoCompleto() {
  let raw = document.getElementById('adm-db-json').value.trim();
  if(!raw) { alert("Nenhum dado encontrado para importar!"); return; }
  try {
    raw = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim();
    let parsed = JSON.parse(raw);
    if(!parsed.teoria || !parsed.questoes) throw new Error("O JSON precisa conter 'teoria' e 'questoes'.");
    DB_TEORIA = parsed.teoria;
    DB_QUESTOES_ALL = parsed.questoes;
    saveState();
    alert(`✅ Conteúdo global importado com sucesso!`);
  } catch(e) {
    alert("❌ Erro ao processar os dados:\n" + e.message);
  }
}

function inicializarDatasCicloSeNecessario() {
  let hojeStr = new Date().toISOString().split('T')[0];
  if(!datasCiclo[1]) datasCiclo[1] = hojeStr;
  let d1 = new Date(datasCiclo[1] + 'T00:00:00');
  for(let i=2; i<=7; i++) {
    if(!datasCiclo[i]) {
      let nextD = new Date(d1);
      nextD.setDate(d1.getDate() + (i - 1));
      datasCiclo[i] = nextD.toISOString().split('T')[0];
    }
  }
}

function alterarDataInicio(novaDataStr) {
  if(!novaDataStr) return;
  datasCiclo[1] = novaDataStr;
  let d1 = new Date(novaDataStr + 'T00:00:00');
  for(let i=2; i<=7; i++) {
    let nextD = new Date(d1);
    nextD.setDate(d1.getDate() + (i - 1));
    datasCiclo[i] = nextD.toISOString().split('T')[0];
  }
  saveState();
}

function alterarDataDiaManual(diaNum, novaDataStr) {
  if(!novaDataStr) return;
  datasCiclo[diaNum] = novaDataStr;
  saveState();
}

function encerrarCicloAtual() {
  if(confirm("Deseja encerrar o ciclo atual? Suas estatísticas serão salvas no relatório e as questões voltarão para a trilha!")) {
    let totFeitas = 0, totAcertos = 0;
    EDITAL_ALL.forEach(item => {
      let stats = getTopicStats(item.id);
      totFeitas += stats.feitas;
      totAcertos += stats.acertos;
    });
    let pctAcerto = totFeitas > 0 ? Math.round((totAcertos / totFeitas) * 100) : 0;
    
    historicoCiclos.push({
      ciclo: cicloAtualNum,
      dataInicio: datasCiclo[1] ? datasCiclo[1].split('-').reverse().join('/') : '-',
      dataFim: new Date().toLocaleDateString('pt-BR'),
      feitas: totFeitas,
      acertos: totAcertos,
      erros: totFeitas - totAcertos,
      pct: pctAcerto
    });

    cadernoAcertos = [];
    cadernoErros = [];
    cicloAtualNum++;
    progress = {};
    datasCiclo = {};
    inicializarDatasCicloSeNecessario();
    saveState();
    alert("🏁 Ciclo encerrado com sucesso!");
  }
}

function renderTrail() {
  if(!CURSO_ATUAL) return;
  inicializarDatasCicloSeNecessario();
  document.getElementById('lbl-ciclo-atual').innerText = `Ciclo Atual (#${cicloAtualNum})`;
  document.getElementById('input-data-inicio').value = datasCiclo[1] || '';

  let html = '';
  let foundCurrent = false;
  for (let d = 1; d <= 7; d++) {
    let items = EDITAL_ALL.filter(x => x.dia === d);
    let concluidos = items.filter(x => {
      let stats = getTopicStats(x.id);
      return stats.feitas > 0 && (x.meta === 0 || stats.feitas >= x.meta);
    }).length;
    let isDone = concluidos === items.length && items.length > 0;
    let isCurrent = !isDone && !foundCurrent;
    if (isCurrent) foundCurrent = true;
    let pctProg = items.length > 0 ? Math.round((concluidos / items.length) * 100) : 0;
    let stateCls = isDone ? 'done' : (isCurrent ? 'current' : '');
    
    let badgeHtml = isDone
      ? `<span class="done-badge">✓ CONCLUÍDO (${concluidos}/${items.length})</span>`
      : (isCurrent ? `<span class="focus-badge">🔥 FOCO ATUAL (${concluidos}/${items.length})</span>` : `<span class="disc-badge">${concluidos}/${items.length} missões</span>`);
    
    let chipsHtml = items.map(it => {
      let stats = getTopicStats(it.id);
      let ok = stats.feitas > 0 && (it.meta === 0 || stats.feitas >= it.meta);
      return `<span class="trail-chip ${ok ? 'ok' : ''}">${ok ? '✓ ' : ''}${it.disc}</span>`;
    }).join('');

    let dataDiaVal = datasCiclo[d] || '';

    html += `
    <div class="trail-node ${stateCls}">
      <div class="trail-dot">${isDone ? '✓' : 'D' + d}</div>
      <div class="trail-card" onclick="openDay(${d})">
        <div class="trail-top">
          <div class="trail-day-title">${DAY_TITLES[d]}</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <div onclick="event.stopPropagation();" style="display:flex;align-items:center;gap:4px;font-size:11.5px;font-family:var(--mono);">
              <span>📅 Data:</span>
              <input type="date" value="${dataDiaVal}" class="form-control" style="padding:2px 6px;font-size:11.5px;width:130px;" onchange="alterarDataDiaManual(${d}, this.value)">
            </div>
            ${badgeHtml}
          </div>
        </div>
        <div class="bar-bg"><div class="bar-fill" style="width:${pctProg}%;"></div></div>
        <div class="trail-chips">${chipsHtml}</div>
        <div class="trail-footer">
          <span style="font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);">Progresso: ${pctProg}%</span>
          <button class="trail-btn" onclick="event.stopPropagation(); openDay(${d});">
            ${isCurrent ? '🚀 Iniciar Dia ' + d : 'Abrir Dia ' + d + ' →'}
          </button>
        </div>
      </div>
    </div>`;
  }
  document.getElementById('trail-list').innerHTML = html;
}

function renderMateriasGrid() {
  // Trabalha estritamente com o edital ativo
  let pool = EDITAL_ALL;
  let html = '';
  
  SUBJECTS_META.forEach(s => {
    let items = pool.filter(x => x.disc === s.disc);
    if(items.length === 0) return; 
    
    // Obtém as stats reais consolidadas para a matéria do edital ativo
    let statsMat = calcularStatsSeguras(items);
    let conc = 0;
    
    items.forEach(item => {
      let tStats = getTopicStats(item.id);
      if (tStats.feitas > 0 && (item.meta === 0 || tStats.feitas >= item.meta)) conc++;
    });

    let pctAcerto = statsMat.feitas > 0 ? Math.round((statsMat.acertos / statsMat.feitas) * 100) : 0;
    let pctProg = items.length > 0 ? Math.round((conc / items.length) * 100) : 0;
    
    html += `
    <div class="disc-card" onclick="openDiscipline('${s.disc}')">
      <div class="disc-top">
        <span class="disc-name">${s.icon} ${s.label}</span>
        <span class="disc-badge">${conc}/${items.length} ok</span>
      </div>
      <div class="bar-bg"><div class="bar-fill" style="width:${pctProg}%;"></div></div>
      <div class="disc-meta">
        <span>📝 ${statsMat.feitas} feitas</span>
        <span>🎯 ${pctAcerto}% acerto</span>
      </div>
    </div>`;
  });
  
  document.getElementById('hub-disciplinas').innerHTML = html;
}

let currentCadernoTab = 'acertos';
let cadernoAnswers = {};

function popularFiltrosCaderno(listaAtual) {

  let selectMat = document.getElementById('filtro-caderno-materia');
  let selectTop = document.getElementById('filtro-caderno-topico');
  let selectBanca = document.getElementById('filtro-caderno-banca');
  if(!selectMat || !selectTop || !selectBanca) return;

  let materiaSelecionadaAntes = selectMat.value;
  let topicoSelecionadoAntes = selectTop.value;
  let bancaSelecionadaAntes = selectBanca.value;

  let materiasUnicas = [...new Set(listaAtual.map(q => q.materia))].filter(Boolean);
  selectMat.innerHTML = `<option value="">Todas</option>` + 
    materiasUnicas.map(m => `<option value="${m}" ${m === materiaSelecionadaAntes ? 'selected' : ''}>${m}</option>`).join('');

  let bancasUnicas = [...new Set(listaAtual.map(q => q.banca))].filter(Boolean);
  selectBanca.innerHTML = `<option value="">Todas</option>` + 
    bancasUnicas.map(bancaVal => `<option value="${bancaVal}" ${bancaVal === bancaSelecionadaAntes ? 'selected' : ''}>${bancaVal}</option>`).join('');

  atualizarFiltroTopicosCaderno(true);
  
  if(topicoSelecionadoAntes) {
    selectTop.value = topicoSelecionadoAntes;
  }
}
function atualizarFiltroTopicosCaderno(manterValor) {
  let selectMat = document.getElementById('filtro-caderno-materia');
  let selectTop = document.getElementById('filtro-caderno-topico');
  if(!selectMat || !selectTop) return;

  let matFiltro = selectMat.value;
  let lista = currentCadernoTab === 'acertos' ? cadernoAcertos : cadernoErros;

  let itensFiltradosPorMat = matFiltro ? lista.filter(q => q.materia === matFiltro) : lista;
  let topicosUnicosIds = [...new Set(itensFiltradosPorMat.map(q => q.topico_id))].filter(Boolean);

  let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let htmlTopicos = `<option value="">Todos os Subtópicos</option>`;
  topicosUnicosIds.forEach(tId => {
    let ed = poolEd.find(e => e.id === tId);
    let nomeTopico = ed ? ed.topico : `Tópico #${tId}`;
    htmlTopicos += `<option value="${tId}">${nomeTopico}</option>`;
  });

  selectTop.innerHTML = htmlTopicos;
  if(!manterValor) selectTop.value = "";
  renderCadernoTab(currentCadernoTab);
}

function renderCadernoTab(tipo) {
  currentCadernoTab = tipo;
  let lista = tipo === 'acertos' ? cadernoAcertos : cadernoErros;

  let btnAcertos = document.getElementById('btn-tab-acertos');
  let btnErros = document.getElementById('btn-tab-erros');
  if(btnAcertos && btnErros) {
    if(tipo === 'acertos') {
      btnAcertos.className = "btn btn-primary";
      btnErros.className = "btn";
      btnErros.style.background = "var(--card-bg2)";
      btnErros.style.color = "var(--fg)";
    } else {
      btnErros.className = "btn btn-danger";
      btnAcertos.className = "btn";
      btnAcertos.style.background = "var(--card-bg2)";
      btnErros.style.color = "var(--fg)";
    }
  }

  let selMatEl = document.getElementById('filtro-caderno-materia');
  if(!selMatEl || selMatEl.options.length <= 1) {
    popularFiltrosCaderno(lista);
  }

  let matFiltro = document.getElementById('filtro-caderno-materia').value;
  let topicoFiltro = document.getElementById('filtro-caderno-topico').value;
  let nivelFiltro = document.getElementById('filtro-caderno-nivel').value;
  let bancaFiltro = document.getElementById('filtro-caderno-banca').value;
  let motivoFiltro = document.getElementById('filtro-caderno-motivo').value;

  let listaFiltrada = lista.filter(q => {
    let matchMat = !matFiltro || q.materia === matFiltro;
    let matchTop = !topicoFiltro || String(q.topico_id) === String(topicoFiltro);
    let matchNivel = !nivelFiltro || String(q.nivel) === String(nivelFiltro);
    let matchBanca = !bancaFiltro || q.banca === bancaFiltro;
    let matchMotivo = !motivoFiltro || q.motivo === motivoFiltro;
    return matchMat && matchTop && matchNivel && matchBanca && matchMotivo;
  });

  let html = '';
  
  if(listaFiltrada.length === 0) {
    html = `<div style="text-align:center;padding:30px;color:var(--ink-soft);">Nenhuma questão encontrada com os filtros selecionados no ${tipo === 'acertos' ? 'Caderno de Acertos' : 'Caderno de Erros'}.</div>`;
  } else {
    let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
    html = listaFiltrada.map((item) => {
      let motivoSelector = '';
      if(tipo === 'acertos') {
        motivoSelector = `
          <select class="pill" style="background:var(--navy);color:#fff;border:1px solid var(--brass);cursor:pointer;font-weight:bold;" onchange="mudarMotivoCaderno('acertos', ${item.id}, this.value)">
            <option value="sabia" ${item.motivo==='sabia'?'selected':''}>🟢 Sabia perfeitamente</option>
            <option value="parcial" ${item.motivo==='parcial'?'selected':''}>🟡 Noção parcial</option>
            <option value="chute" ${item.motivo==='chute'?'selected':''}>🟠 Chute cego</option>
            <option value="ajuda" ${item.motivo==='ajuda'?'selected':''}>💡 Fiz com Ajuda</option>
          </select>`;
      } else {
        let vezes = item.tentativasErros || 1;
        motivoSelector = `
          <select class="pill" style="background:var(--red);color:#fff;border:1px solid var(--line);cursor:pointer;font-weight:bold;" onchange="mudarMotivoCaderno('erros', ${item.id}, this.value)">
            <option value="dificil" ${item.motivo==='dificil'?'selected':''}>🔴 Tava muito difícil</option>
            <option value="detalhe" ${item.motivo==='detalhe'?'selected':''}>⚠️ Errei por detalhe / desatenção</option>
            <option value="ajuda" ${item.motivo==='ajuda'?'selected':''}>💡 Precisei de Ajuda</option>
          </select>
          <span class="pill" style="background:var(--card-bg2);color:var(--ink-soft);">Erros: ${vezes}x</span>`;
      }

      let keyAns = `${tipo}_${item.id}`;
      let ans = cadernoAnswers[keyAns];
      let LETTERS = ['A','B','C','D','E'];

      let optsHtml = item.opts.map((opt, i) => {
        let cls = 'opt-btn';
        if(ans && ans.selected !== undefined) {
          if(i === item.correct) cls += ' correct';
          else if(i === ans.selected) cls += ' wrong';
          else cls += ' dim';
        }
        return `<div class="opt-row"><button class="${cls}" onclick="responderQuestaoCaderno('${tipo}', ${item.id}, ${i})"><span class="opt-letter">${LETTERS[i]}</span>${opt}</button></div>`;
      }).join('');

      let feedbackBox = '';
      let retryBtn = '';
      if(ans && ans.selected !== undefined) {
        feedbackBox = `
          <div class="${ans.correct ? 'stamp ok' : 'stamp no'}">${ans.correct ? 'CORRETO' : 'INCORRETO'}</div>
          <div class="expl-box"><b style="font-family:var(--mono);font-size:11px;color:var(--brass);display:block;margin-bottom:6px;">COMENTÁRIO</b>${item.expl}</div>
        `;
        retryBtn = `<button class="btn" style="margin-top:10px;background:var(--card-bg2);color:var(--brass);border-color:var(--brass);" onclick="tentarNovamenteCaderno('${tipo}', ${item.id})">🔄 Tentar Novamente</button>`;
      }

      let edTop = poolEd.find(e => e.id === item.topico_id);
      let nomeSubTopico = edTop ? edTop.topico : 'Subtópico Geral';

      return `
      <div class="topic-card">
        <div class="q-meta-top">
          <span class="pill pill-disc">${item.materia || 'Geral'}</span>
          <span class="pill" style="background:var(--card-bg2);color:var(--brass-2);border-color:var(--brass);">${nomeSubTopico}</span>
          <span class="pill">${item.banca || 'AOCP'}</span>
          <span class="pill pill-nivel-${item.nivel || 2}">Nível ${item.nivel || 2}</span>
          ${motivoSelector}
          <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap;">
            <button class="btn" style="padding:2px 8px;font-size:11px;background:var(--card-bg2);color:var(--brass);border-color:var(--brass);" onclick="abrirModalEditarQuestaoId(${item.id})">✏️ Editar</button>
            <button class="btn btn-primary" style="padding:2px 8px;font-size:11px;background:var(--brass);border-color:var(--brass);" onclick="resetarParaTrilha('${tipo}', ${item.id})">🔄 p/ Trilha</button>
            <button class="btn btn-danger" style="padding:2px 8px;font-size:11px;" onclick="removerDoCaderno('${tipo}', ${item.id})">🗑️ Excluir</button>
          </div>
        </div>
        <p class="q-text">${item.q}</p>
        ${optsHtml}
        ${feedbackBox}
        ${retryBtn}
      </div>`;
    }).join('');
  }
  document.getElementById('content-cadernos').innerHTML = html;
  renderizarMatematica();
}

function mudarMotivoCaderno(tipo, qId, novoMotivo) {
  let lista = tipo === 'acertos' ? cadernoAcertos : cadernoErros;
  let item = lista.find(x => x.id === qId);
  if(item) {
    item.motivo = novoMotivo;
    saveState();
  }
}

function responderQuestaoCaderno(tipo, qId, optIdx) {
  let keyAns = `${tipo}_${qId}`;
  if(cadernoAnswers[keyAns] && cadernoAnswers[keyAns].selected !== undefined) return;

  let lista = tipo === 'acertos' ? cadernoAcertos : cadernoErros;
  let item = lista.find(x => x.id === qId);
  if(!item) return;
  let correct = (optIdx === item.correct);

  cadernoAnswers[keyAns] = { selected: optIdx, correct: correct };

  if(tipo === 'erros') {
    if(correct) {
      let index = lista.findIndex(x => x.id === qId);
      if(index !== -1) lista.splice(index, 1);
      item.motivo = 'sabia';
      item.timestamp = Date.now();
      cadernoAcertos.unshift(item);
    } else {
      item.tentativasErros = (item.tentativasErros || 1) + 1;
    }
  }
  saveState();
  renderCadernoTab(currentCadernoTab);
}

function tentarNovamenteCaderno(tipo, qId) {
  let keyAns = `${tipo}_${qId}`;
  delete cadernoAnswers[keyAns];
  renderCadernoTab(currentCadernoTab);
}

function resetarParaTrilha(tipo, qId) {
  if(confirm("Deseja enviar esta questão de volta para a trilha?")) {
    let lista = tipo === 'acertos' ? cadernoAcertos : cadernoErros;
    let index = lista.findIndex(x => x.id === qId);
    if(index !== -1) {
      lista.splice(index, 1);
    }
    delete quizAnswers[qId];
    delete cadernoAnswers[`acertos_${qId}`];
    delete cadernoAnswers[`erros_${qId}`];
    
    saveState();
    renderCadernoTab(currentCadernoTab);
  }
}

function removerDoCaderno(tipo, qId) {
  if(confirm("Deseja excluir permanentemente?")) {
    let lista = tipo === 'acertos' ? cadernoAcertos : cadernoErros;
    let index = lista.findIndex(x => x.id === qId);
    if(index !== -1) {
      lista.splice(index, 1);
    }
    delete quizAnswers[qId];
    delete cadernoAnswers[`acertos_${qId}`];
    delete cadernoAnswers[`erros_${qId}`];
    saveState();
    renderCadernoTab(tipo);
  }
}

function popularSelectsEdicao() {
  let selMat = document.getElementById('edit-q-materia');
  selMat.innerHTML = SUBJECTS_META.map(s => `<option value="${s.disc}">${s.disc}</option>`).join('');

  let bancasUnicas = new Set(["AOCP", "IA"]);
  DB_QUESTOES_ALL.forEach(q => { if(q.banca) bancasUnicas.add(q.banca); });

  let selBanca = document.getElementById('edit-q-banca');
  let htmlBancas = '';
  bancasUnicas.forEach(b => { htmlBancas += `<option value="${b}">${b}</option>`; });
  htmlBancas += `<option value="custom">➕ Outra...</option>`;
  selBanca.innerHTML = htmlBancas;
}

function checarNovaBanca(selectEl) {
  let customInput = document.getElementById('edit-q-banca-custom');
  if(selectEl.value === 'custom') {
    customInput.style.display = 'block';
    customInput.focus();
  } else {
    customInput.style.display = 'none';
    customInput.value = '';
  }
}

function abrirModalEditarQuestaoId(qId) {
  let q = (typeof quizList !== 'undefined' ? quizList.find(x => x.id === qId) : null)
       || cadernoAcertos.find(x => x.id === qId) 
       || cadernoErros.find(x => x.id === qId);

  if (!q) { 
    alert("Questão não encontrada!"); 
    return; 
  }

  popularSelectsEdicao();
  document.getElementById('edit-q-id').value = q.id;
  document.getElementById('edit-q-materia').value = q.materia || SUBJECTS_META[0].disc;
  document.getElementById('edit-q-nivel').value = q.nivel || 2;
  document.getElementById('edit-q-correct').value = q.correct !== undefined ? q.correct : 0;
  document.getElementById('edit-q-texto').value = q.q || '';
  document.getElementById('edit-q-opt0').value = q.opts?.[0] || '';
  document.getElementById('edit-q-opt1').value = q.opts?.[1] || '';
  document.getElementById('edit-q-opt2').value = q.opts?.[2] || '';
  document.getElementById('edit-q-opt3').value = q.opts?.[3] || '';
  document.getElementById('edit-q-opt4').value = q.opts?.[4] || '';
  document.getElementById('edit-q-expl').value = q.expl || '';

  document.getElementById('modal-editar-questao').style.display = 'flex';
}
function fecharModalEditarQuestao() { document.getElementById('modal-editar-questao').style.display = 'none'; }

async function salvarQuestaoEditada() {
  let qId = parseInt(document.getElementById('edit-q-id').value);
  let materia = document.getElementById('edit-q-materia').value;
  let selBanca = document.getElementById('edit-q-banca').value;
  let banca = selBanca === 'custom' ? document.getElementById('edit-q-banca-custom').value.trim() : selBanca;
  let nivel = parseInt(document.getElementById('edit-q-nivel').value) || 2;
  let correct = parseInt(document.getElementById('edit-q-correct').value) || 0;
  let texto = document.getElementById('edit-q-texto').value;
  let expl = document.getElementById('edit-q-expl').value;
  let opts = [
    document.getElementById('edit-q-opt0').value,
    document.getElementById('edit-q-opt1').value,
    document.getElementById('edit-q-opt2').value,
    document.getElementById('edit-q-opt3').value,
    document.getElementById('edit-q-opt4').value
  ];

  let qDataUpdate = {
    materia: materia,
    banca: banca || "AOCP",
    nivel: nivel,
    gabarito: correct,
    enunciado: texto,
    explicacao: expl,
    alternativas: opts
  };

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/questoes?id=eq.${qId}`, {
      method: 'PATCH',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(qDataUpdate)
    });

    if (typeof quizList !== 'undefined') {
      let itemQuiz = quizList.find(x => x.id === qId);
      if (itemQuiz) {
        itemQuiz.materia = materia;
        itemQuiz.banca = banca || "AOCP";
        itemQuiz.nivel = nivel;
        itemQuiz.correct = correct;
        itemQuiz.q = texto;
        itemQuiz.expl = expl;
        itemQuiz.opts = opts;
      }
    }

    [cadernoAcertos, cadernoErros].forEach(lista => {
      let itemLocal = lista.find(x => x.id === qId);
      if (itemLocal) {
        itemLocal.materia = materia;
        itemLocal.banca = banca || "AOCP";
        itemLocal.nivel = nivel;
        itemLocal.correct = correct;
        itemLocal.q = texto;
        itemLocal.expl = expl;
        itemLocal.opts = opts;
      }
    });

    saveState();
    fecharModalEditarQuestao();
    alert("✅ Questão atualizada com sucesso!");

    if (document.getElementById('view-quiz').style.display === 'block') {
      renderQuizView();
    } else if (document.getElementById('view-cadernos').style.display === 'block') {
      renderCadernoTab(currentCadernoTab);
    }
  } catch(e) {
    alert("Erro ao salvar alterações da questão.");
  }
}
function openDay(diaNum) {
  hideAllViews();
  CURRENT_FILTER = { type: 'dia', val: diaNum };
  document.getElementById('view-topicos').style.display = 'block';
  document.getElementById('btn-voltar-lista').innerText = '⬅ Voltar para a Trilha';
  document.getElementById('btn-voltar-lista').onclick = () => showMainView('trilha');
  document.getElementById('lista-titulo').innerText = `${DAY_TITLES[diaNum]}`;
  renderFilteredTopics();
  window.scrollTo(0, 0);
}

function openDiscipline(discName) {
  hideAllViews();
  CURRENT_FILTER = { type: 'disc', val: discName };
  document.getElementById('view-topicos').style.display = 'block';
  document.getElementById('btn-voltar-lista').innerText = '⬅ Voltar para Matérias';
  document.getElementById('btn-voltar-lista').onclick = () => showMainView('materias');
  const metaObj = SUBJECTS_META.find(x => x.disc === discName);
  document.getElementById('lista-titulo').innerText = metaObj ? `${metaObj.icon} ${metaObj.label}` : discName;
  renderFilteredTopics();
  window.scrollTo(0, 0);
}

function renderFilteredTopics() {
  let items = CURRENT_FILTER.type === 'dia'
    ? EDITAL_ALL.filter(x => x.dia === CURRENT_FILTER.val)
    : EDITAL_ALL.filter(x => x.disc === CURRENT_FILTER.val);
  document.getElementById('content-topicos').innerHTML = items.map(item => createCard(item)).join('');
  renderizarMatematica();
}


function toggleTeoria(id) {
  const el = document.getElementById('teoria-' + id);
  if (el) el.classList.toggle('open');
}

function resetTopic(id) {
  if(confirm("Deseja zerar o progresso deste tópico?")) {
    progress[id] = { revisar: false, note: "" };
    cadernoAcertos = cadernoAcertos.filter(q => q.topico_id !== id);
    cadernoErros = cadernoErros.filter(q => q.topico_id !== id);
    delete temposTopicos[id];
    delete datasTopicos[id];
    saveState();
  }
}

function createCard(item) {
  let stats = getTopicStats(item.id);
  let p = getP(item.id);
  let isConcluido = stats.feitas > 0 && (item.meta === 0 || stats.feitas >= item.meta);
  let status = isConcluido ? 'Concluído' : (stats.feitas > 0 ? 'Andamento' : 'Pendente');
  let pctColor = stats.feitas === 0 ? 'var(--ink-soft)' : (stats.pct >= 80 ? 'var(--green)' : (stats.pct >= 60 ? 'var(--brass)' : 'var(--red)'));
  let statusCls = isConcluido ? 'status-conc' : (stats.feitas > 0 ? 'status-and' : 'status-pend');
  
  let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let idsValidosRes = [item.id];
  if (item.equivalente_id) {
    idsValidosRes = poolEd.filter(e => e.equivalente_id === item.equivalente_id).map(e => e.id);
  }
  let teoriaHtml = DB_TEORIA[item.id] || `<h4>📖 Nenhum resumo cadastrado</h4><p>Clique em Editar Resumo para adicionar.</p>`;
  let tempoGastoStr = temposTopicos[item.id] ? `<span class="pill" style="background:var(--card-bg2);color:var(--brass-2);">⏱️ ${formatarTempo(temposTopicos[item.id])}</span>` : '';

  setTimeout(() => atualizarContadorQuestoesCard(item.id, `btn-q-${item.id}`), 50);

  let cardClass = isConcluido ? 'topic-card completed-topic' : 'topic-card';
  let bodyDisplay = isConcluido ? 'none' : 'block';
  let metaText = item.meta > 0 ? `${stats.feitas} questões feitas de ${item.meta} (Meta)` : `${stats.feitas} questões feitas`;
  let metaPct = item.meta > 0 ? Math.min(100, Math.round((stats.feitas / item.meta) * 100)) : (stats.feitas > 0 ? 100 : 0);

  return `
  <div class="${cardClass}">
    <div class="topic-head">
      <span class="pill pill-disc">ID #${item.id} • ${item.disc} (Dia ${item.dia})</span>
      <div style="display:flex;gap:6px;align-items:center;">
        ${tempoGastoStr}
        <button class="btn btn-danger" style="padding:2px 8px;font-size:11px;margin:0;" onclick="resetTopic(${item.id})">🔄 Resetar</button>
        <span class="pill ${statusCls}">${status}</span>
        <button class="btn" style="padding:2px 8px;font-size:11px;margin:0;background:var(--card-bg2);" onclick="toggleTopicBody(${item.id})">↕ Expandir/Minimizar</button>
      </div>
    </div>
    <div class="topic-title">${item.topico}</div>
    
    <div style="margin: 10px 0 14px 0;">
      <div style="display:flex; justify-content:space-between; font-size:11.5px; font-family:var(--mono); color:var(--ink-soft); margin-bottom:4px;">
        <span>${metaText}</span>
        <span>${metaPct}%</span>
      </div>
      <div class="bar-bg" style="height:6px; margin:0;">
        <div class="bar-fill" style="width:${metaPct}%; background: ${isConcluido ? 'var(--green)' : 'var(--brass)'}; transition: width 0.3s ease;"></div>
      </div>
    </div>

    <div id="topic-body-${item.id}" style="display:${bodyDisplay}; border-top:1px dashed var(--line); padding-top: 14px;">
      <div class="action-row">
        <button class="action-btn btn-teoria" onclick="toggleTeoria(${item.id})">📖 Ver Resumo</button>
        <button class="action-btn" style="background:var(--card-bg2);color:var(--brass);border-color:var(--brass);" onclick="abrirModalResumo(${item.id})">✏️ Editar Resumo</button>
        <button class="action-btn btn-questoes" id="btn-q-${item.id}" onclick="openQuiz(${item.id})">📝 Questões (...)</button>
        <button class="action-btn btn-importar" onclick="abrirModalImportar(${item.id})">📥 Importar JSON</button>
      </div>
      <div class="teoria-box" id="teoria-${item.id}">${teoriaHtml}</div>
      <div class="topic-controls">
        <div class="ctrl-group"><label>Meta</label><input type="number" class="num-input" value="${item.meta}" onchange="updateMeta(${item.id}, this.value)"></div>
        <div class="ctrl-group"><label>Feitas</label><div class="ctrl-val">${stats.feitas}</div></div>
        <div class="ctrl-group"><label>Acertos</label><div class="ctrl-val">${stats.acertos}</div></div>
        <div class="ctrl-group"><label>% Acerto</label><div class="ctrl-val" style="color:${pctColor};">${stats.pct}%</div></div>
      </div>
      <div class="topic-footer">
        <label class="check-rev ${p.revisar ? '' : 'off'}"><input type="checkbox" ${p.revisar ? 'checked' : ''} onchange="toggleR(${item.id})"> ⚠️ Precisa Revisar</label>
        <input type="text" placeholder="Anotações..." value="${p.note||''}" onchange="updateNote(${item.id}, this.value)" style="flex:1;margin-left:10px;border:1px solid var(--line);border-radius:6px;padding:6px;background:var(--bg);color:var(--fg);font-size:12px;">
      </div>
    </div>
  </div>`;
}

function toggleTopicBody(id) {
  let el = document.getElementById('topic-body-' + id);
  if(el) {
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
  }
}

function abrirModalResumo(id) {
  document.getElementById('edit-res-id').value = id;
  document.getElementById('edit-res-texto').value = DB_TEORIA[id] || '';
  document.getElementById('modal-resumo').style.display = 'flex';
}
function fecharModalResumo() { document.getElementById('modal-resumo').style.display = 'none'; }
function salvarResumoDireto() {
  let id = document.getElementById('edit-res-id').value;
  let texto = document.getElementById('edit-res-texto').value;
  if (!texto.trim()) delete DB_TEORIA[id]; else DB_TEORIA[id] = texto;
  saveState();
  fecharModalResumo();
  renderFilteredTopics();
  alert("✅ Resumo salvo!");
}

window._topicoIdAtual = null; // Variável global de segurança

function abrirModalImportar(id) {
  window._topicoIdAtual = id; // Guarda o ID de forma infalível
  
  let spanId = document.getElementById('imp-topico-id');
  if(spanId) spanId.innerText = id;
  
  let inputNum = document.getElementById('imp-topico-num');
  if(inputNum) inputNum.value = id;
  
  let caixaTexto = document.getElementById('adm-massa-texto');
  if(caixaTexto) caixaTexto.value = '';
  
  let modal = document.getElementById('modal-importar');
  if(modal) modal.style.display = 'flex';
}
function fecharModalImportar() { document.getElementById('modal-importar').style.display = 'none'; }

async function importarEmMassaTopico() {
  let topicoId = parseInt(document.getElementById('imp-topico-num').value);
  let raw = document.getElementById('adm-massa-texto').value.trim();
  if(!raw) { alert("Cole o JSON com as questões!"); return; }
  
  try {
    let parsed = JSON.parse(raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/, '').trim());
    if(!Array.isArray(parsed)) throw new Error("O formato deve ser um array JSON [...]");
    
    // CORREÇÃO: Utilizar a função correta que já existe no final do seu app.js
    let poolEd = getTodosTopicosGlobais(); 
    let ed = poolEd.find(e => e.id === topicoId);
    let materiaPadrao = ed ? ed.disc : "Geral";

    let novasQuestoesSupabase = parsed.map(q => ({
      topico_id: topicoId,
      materia: q.materia || materiaPadrao,
      banca: q.banca || "AOCP",
      nivel: q.nivel ?? 2,
      enunciado: q.q,
      alternativas: q.opts,
      gabarito: q.correct,
      explicacao: q.expl
    }));

    let res = await fetch(`${SUPABASE_URL}/rest/v1/questoes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify(novasQuestoesSupabase)
    });

    if (!res.ok) throw new Error("Erro ao salvar no Supabase. Verifique se a tabela 'questoes' foi criada corretamente.");

    alert("✅ Questões importadas e salvas no banco de dados com sucesso!");
    fecharModalImportar();
    if(document.getElementById('view-topicos').style.display === 'block') {
      renderFilteredTopics();
    }
  } catch(e) { 
    alert("❌ Erro ao importar: " + e.message); 
  }
}
function exportarBancoCompleto() {
  let banco = { teoria: DB_TEORIA, questoes: DB_QUESTOES_ALL };
  let blob = new Blob([JSON.stringify(banco, null, 2)], { type: "application/json" });
  let url = URL.createObjectURL(blob);
  let a = document.createElement('a');
  a.href = url; a.download = `conteudo_global.json`;
  a.click();
}

async function excluirQuestaoQuiz(qId) {
  if(confirm("Excluir esta questão do banco de dados?")) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/questoes?id=eq.${qId}`, {
        method: 'DELETE',
        headers: { 
          'apikey': SUPABASE_ANON_KEY, 
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
        }
      });
      
      cadernoAcertos = cadernoAcertos.filter(q => q.id !== qId);
      cadernoErros = cadernoErros.filter(q => q.id !== qId);
      saveState();
      closeQuizBack();
      alert("🗑️ Questão excluída com sucesso!");
    } catch(e) {
      alert("Erro ao excluir questão.");
    }
  }
}

let quizList = [], quizPos = 0, quizAnswers = {}, quizElims = {}, quizTopicoIdAtual = null;
let quizTimerSeconds = 0, quizTimerInterval = null, quizIsPaused = false;

function getElim(id) { if(!quizElims[id]) quizElims[id]=new Set(); return quizElims[id]; }

async function openQuiz(topicoId) {
  let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let itemAtual = poolEd.find(e => e.id === topicoId);
  
  let idsParaBuscar = [topicoId];
  if (itemAtual && itemAtual.equivalente_id) {
    idsParaBuscar = poolEd
      .filter(e => e.equivalente_id === itemAtual.equivalente_id)
      .map(e => e.id);
  }

  try {
    let idsQuery = idsParaBuscar.join(',');
    let res = await fetch(`${SUPABASE_URL}/rest/v1/questoes?topico_id=in.(${idsQuery})&select=*`, {
      method: 'GET',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}` 
      }
    });
    
    let dadosSupabase = await res.json();
    
    let questoesDoTopico = (dadosSupabase || []).map(q => ({
      id: q.id,
      topico_id: q.topico_id,
      materia: q.materia,
      banca: q.banca,
      nivel: q.nivel,
      q: q.enunciado,
      opts: q.alternativas,
      correct: q.gabarito,
      expl: q.explicacao
    }));

    quizList = questoesDoTopico.filter(q => !isQuestionArchived(q.id));

  } catch (e) {
    console.error("Erro ao buscar questões do Supabase:", e);
    quizList = [];
  }
  
  if(quizList.length === 0) { 
    alert("Não há questões cadastradas ou pendentes neste tópico."); 
    return; 
  }
  
  hideAllViews();
  document.getElementById('view-quiz').style.display = 'block';
  quizPos = 0; quizAnswers = {}; quizElims = {};
  quizTopicoIdAtual = topicoId;
  quizTimerSeconds = 0;
  quizIsPaused = false;
  iniciarCronometroQuiz();
  renderQuizView();
}

function iniciarCronometroQuiz() {
  if(quizTimerInterval) clearInterval(quizTimerInterval);
  quizTimerInterval = setInterval(() => {
    if(!quizIsPaused) {
      quizTimerSeconds++;
      let el = document.getElementById('quiz-timer-display');
      if(el) el.innerText = formatarTempo(quizTimerSeconds);
    }
  }, 1000);
}

function pausarRetomarCronometro() {
  quizIsPaused = !quizIsPaused;
  let btn = document.getElementById('btn-pausa-cron');
  if(btn) {
    btn.innerText = quizIsPaused ? "▶️ Continuar" : "⏸️ Pausar";
    btn.style.background = quizIsPaused ? "var(--green)" : "var(--card-bg2)";
    btn.style.color = quizIsPaused ? "#fff" : "var(--fg)";
  }
}

function resetarCronometro() {
  quizTimerSeconds = 0;
  let el = document.getElementById('quiz-timer-display');
  if(el) el.innerText = formatarTempo(0);
}

function closeQuizBack() {
  hideAllViews();
  if (CURRENT_FILTER.type === 'dia') openDay(CURRENT_FILTER.val);
  else if (CURRENT_FILTER.type === 'disc') openDiscipline(CURRENT_FILTER.val);
  else showMainView('trilha');
}

function concluirQuizEDe(concluirAutomatico) {
  let tempoTotalTopico = (temposTopicos[quizTopicoIdAtual] || 0) + quizTimerSeconds;
  hideAllViews();
  let tempoFinalStr = formatarTempo(tempoTotalTopico);
  if(concluirAutomatico) {
    alert(`🎉 Parabéns! Você concluiu o tópico.\n⏱️ Tempo total levado: ${tempoFinalStr}`);
  }
  if (CURRENT_FILTER.type === 'dia') openDay(CURRENT_FILTER.val);
  else if (CURRENT_FILTER.type === 'disc') openDiscipline(CURRENT_FILTER.val);
  else showMainView('trilha');
}

function toggleQStrike(id, idx, ev) {
  ev.stopPropagation();
  const set = getElim(id);
  if(set.has(idx)) set.delete(idx); else set.add(idx);
  renderQuizView();
}

function selectQOpt(id, idx) {
  if(quizAnswers[id]?.selected !== undefined) return;
  const q = quizList.find(x => x.id === id);
  const correct = (idx === q.correct);
  
  let motivoInicial = correct ? 'sabia' : 'dificil';

  quizAnswers[id] = { selected: idx, correct: correct, motivo: motivoInicial };
  let questaoArquivada = { ...q, respostaUsuario: idx, motivo: motivoInicial, tentativasErros: 1, timestamp: Date.now() };

  // Removemos primeiro qualquer ocorrência anterior desta mesma questão nos cadernos para evitar duplicação
  cadernoAcertos = cadernoAcertos.filter(item => item.id !== id);
  cadernoErros = cadernoErros.filter(item => item.id !== id);

  if(correct) {
    cadernoAcertos.unshift(questaoArquivada);
  } else {
    cadernoErros.unshift(questaoArquivada);
  }

  saveState();
  renderQuizView();
}

function definirMotivo(id, motivo) {
  if(quizAnswers[id]) {
    quizAnswers[id].motivo = motivo;
  }
  
  let foundAcerto = cadernoAcertos.find(x => x.id === id);
  let foundErro = cadernoErros.find(x => x.id === id);
  
  if(foundAcerto) {
    foundAcerto.motivo = motivo;
  }
  if(foundErro) {
    foundErro.motivo = motivo;
  }
  
  saveState();
  renderQuizView();
}

function qNext() { 
  if(quizPos < quizList.length - 1) { 
    quizPos++; 
    renderQuizView(); 
  } else {
    concluirQuizEDe(true);
  }
}

function qPrev() { if(quizPos > 0) { quizPos--; renderQuizView(); } }

window.addEventListener('keydown', (e) => {
  if(document.getElementById('view-quiz').style.display === 'block') {
    if(e.key === 'ArrowRight') qNext();
    else if(e.key === 'ArrowLeft') qPrev();
  }
});

function renderQuizView() {
  if(quizList.length === 0 || quizPos >= quizList.length) { closeQuizBack(); return; }
  const q = quizList[quizPos];
  const ans = quizAnswers[q.id];
  const elimSet = getElim(q.id);
  const LETTERS = ['A','B','C','D','E'];
  
  let pctProgresso = Math.round(((quizPos + 1) / quizList.length) * 100);

  let segmentosHTML = quizList.map((qItem, i) => {
    let ansItem = quizAnswers[qItem.id];
    let corSegmento = 'transparent'; 
    if (ansItem && ansItem.selected !== undefined) {
      corSegmento = ansItem.correct ? 'var(--green)' : 'var(--red)'; 
    } else if (i < quizPos) {
      corSegmento = 'var(--brass)'; 
    } else if (i === quizPos) {
      corSegmento = 'rgba(184, 145, 47, 0.25)'; 
    }
    return `<div style="flex:1; height:100%; background:${corSegmento}; border-right:1px solid rgba(0,0,0,0.2);"></div>`;
  }).join('');

  let optsHtml = q.opts.map((opt, i) => {
    let cls = 'opt-btn';
    if(ans?.selected !== undefined) {
      if(i === q.correct) cls += ' correct';
      else if(i === ans.selected) cls += ' wrong';
      else cls += ' dim';
    } else if(elimSet.has(i)) cls += ' struck';
    let strikeBtn = (!ans || ans.selected === undefined) ? `<button class="strike-btn ${elimSet.has(i)?'active':''}" onclick="toggleQStrike(${q.id}, ${i}, event)">✕</button>` : '';
    return `<div class="opt-row"><button class="${cls}" onclick="selectQOpt(${q.id}, ${i})"><span class="opt-letter">${LETTERS[i]}</span>${opt}</button>${strikeBtn}</div>`;
  }).join('');

  let botaoNaoSei = (!ans || ans.selected === undefined) ? `
    <div style="margin-top: 12px; text-align: right;">
      <button class="btn btn-danger" style="font-size: 12px; padding: 6px 12px;" onclick="marcarComoNaoSoubeFazer(${q.id})">
        🚨 Não sei / Mandar para Caderno de Erros
      </button>
    </div>` : '';

  let motivoBlock = '';
  if(ans?.selected !== undefined) {
    if(ans.correct) {
      motivoBlock = `<div style="margin-top:16px;background:var(--card-bg2);padding:14px;border-radius:8px;border:1px solid var(--brass);">
        <b style="display:block;margin-bottom:8px;color:var(--brass-2);">🎯 Por que acertou?</b>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn ${ans.motivo==='sabia'?'btn-primary':''}" style="${ans.motivo==='sabia'?'':'background:var(--green);color:#fff;'}" onclick="definirMotivo(${q.id}, 'sabia')">🟢 Sabia</button>
          <button class="btn ${ans.motivo==='parcial'?'btn-primary':''}" style="${ans.motivo==='parcial'?'':'background:var(--brass);color:#fff;'}" onclick="definirMotivo(${q.id}, 'parcial')">🟡 Parcial</button>
          <button class="btn ${ans.motivo==='chute'?'btn-primary':''}" style="${ans.motivo==='chute'?'':'background:var(--navy);color:#fff;'}" onclick="definirMotivo(${q.id}, 'chute')">🟠 Chute</button>
          <button class="btn ${ans.motivo==='ajuda'?'btn-primary':''}" style="${ans.motivo==='ajuda'?'':'background:#2B4C7E;color:#fff;'}" onclick="definirMotivo(${q.id}, 'ajuda')">💡 Fiz com Ajuda / Resolução Guiada</button>
        </div>
      </div>`;
    } else {
      motivoBlock = `<div style="margin-top:16px;background:var(--card-bg2);padding:14px;border-radius:8px;border:1px solid var(--red);">
        <b style="display:block;margin-bottom:8px;color:var(--red);">⚠️ Por que errou?</b>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button class="btn ${ans.motivo==='dificil'?'btn-primary':''}" style="${ans.motivo==='dificil'?'':'background:var(--red);color:#fff;'}" onclick="definirMotivo(${q.id}, 'dificil')">🔴 Difícil</button>
          <button class="btn ${ans.motivo==='detalhe'?'btn-primary':''}" style="${ans.motivo==='detalhe'?'':'background:var(--navy);color:#fff;'}" onclick="definirMotivo(${q.id}, 'detalhe')">⚠️ Detalhe</button>
          <button class="btn ${ans.motivo==='ajuda'?'btn-primary':''}" style="${ans.motivo==='ajuda'?'':'background:#2B4C7E;color:#fff;'}" onclick="definirMotivo(${q.id}, 'ajuda')">💡 Precisei de Ajuda / Resolução Guiada</button>
        </div>
      </div>`;
    }
  }
  let botaoNivel4 = (ans && ans.selected !== undefined) ? `
    <div style="margin-top: 10px;">
      <button class="btn" style="background:#3E1C38; color:#FF79C6; border-color:#FF79C6; font-size:11.5px; padding:4px 10px;" onclick="tornarQuestaoImpossivel(${q.id})">
        🔥 Marcar como Nível 4 (Impossível)
      </button>
    </div>` : '';

  let resultBlock = ans?.selected !== undefined ? `
    <div class="${ans.correct ? 'stamp ok' : 'stamp no'}">${ans.correct ? 'CORRETO' : 'INCORRETO'}</div>
    ${motivoBlock}
    <div class="expl-box"><b style="font-family:var(--mono);font-size:11px;color:var(--brass);display:block;margin-bottom:6px;">COMENTÁRIO DA RESOLUÇÃO</b>${q.expl}</div>
    <div style="margin-top:16px;"><button class="btn btn-primary" onclick="qNext()">${quizPos === quizList.length-1 ? '🏁 Concluir Tópico' : 'Próxima Questão →'}</button></div>` : '';
  
  document.getElementById('content-quiz').innerHTML = `
    <div class="topic-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px;">
        <button class="btn" onclick="closeQuizBack()">⬅ Sair e Salvar Tempo</button>
        <div style="display:flex;gap:12px;align-items:center;background:var(--card-bg2);padding:6px 12px;border-radius:8px;border:1px solid var(--line);">
          <span style="font-family:var(--mono);font-size:13px;font-weight:bold;color:var(--brass-2);">⏱️ <span id="quiz-timer-display">${formatarTempo(quizTimerSeconds)}</span></span>
          <button class="btn" id="btn-pausa-cron" style="padding:4px 8px;font-size:11px;" onclick="pausarRetomarCronometro()">⏸️ Pausar</button>
          <button class="btn" style="padding:4px 8px;font-size:11px;" onclick="resetarCronometro()">🔄 Resetar</button>
        </div>
        <div style="display:flex;gap:6px;">
          <button class="btn" style="padding:6px 12px;font-size:12px;background:var(--card-bg2);color:var(--brass);border-color:var(--brass);" onclick="abrirModalEditarQuestaoId(${q.id})">✏️ Editar</button>
          <button class="btn btn-danger" onclick="excluirQuestaoQuiz(${q.id})" style="padding:6px 12px;font-size:12px;">🗑️ Excluir</button>
        </div>
      </div>

      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:11.5px;color:var(--ink-soft);margin-bottom:4px;">
          <span>Progresso do Tópico: Questão ${quizPos + 1} de ${quizList.length}</span>
          <span><b>${pctProgresso}%</b></span>
        </div>
        <div class="bar-bg" style="display:flex; overflow:hidden; padding:0; background:var(--card-bg2);">
          ${segmentosHTML}
        </div>
      </div>

      <div class="q-meta-top"><span class="pill pill-disc">${q.materia}</span><span class="pill">${q.banca}</span><span class="pill pill-nivel-${q.nivel}">Nível ${q.nivel}</span><span class="pill">💡 Dica: Use as setas ← → do teclado</span></div>
      <p class="q-text">${q.q}</p>
      ${optsHtml}
      ${botaoNaoSei}
      ${resultBlock}
      <div style="display:flex;justify-content:space-between;margin-top:20px;padding-top:16px;border-top:1px solid var(--line);">
        <button class="btn" onclick="qPrev()" ${quizPos === 0 ? 'disabled' : ''}>← Anterior</button>
        <button class="btn btn-primary" onclick="qNext()">${quizPos === quizList.length-1 ? '🏁 Concluir' : 'Próxima →'}</button>
      </div>
    </div>`;
  renderizarMatematica();
}

function marcarComoNaoSoubeFazer(id) {
  const q = quizList.find(x => x.id === id);
  let alternativaFalsa = (q.correct === 0) ? 1 : 0;
  
  quizAnswers[id] = { selected: alternativaFalsa, correct: false, motivo: 'dificil' };
  let questaoArquivada = { ...q, respostaUsuario: alternativaFalsa, motivo: 'dificil', tentativasErros: 1, timestamp: Date.now() };

  cadernoErros.unshift(questaoArquivada);
  saveState();
  renderQuizView();
}
function updateMeta(id, val) { 
  let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let item = poolEd.find(x => x.id === id); 
  if (item) { item.meta = Math.max(0, parseInt(val) || 0); customMeta[id] = item.meta; saveState(); } 
}
function toggleR(id) { let p = getP(id); p.revisar = !p.revisar; saveState(); }
function updateNote(id, val) { let p = getP(id); p.note = val; saveState(); }

function renderRev() {
  let poolEd = CURSO_ATUAL ? EDITAL_ALL : [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let items = poolEd.filter(x => { let stats = getTopicStats(x.id); let p = getP(x.id); return p.revisar || (stats.feitas > 0 && stats.pct < 70); });
  document.getElementById('content-rev').innerHTML = items.length === 0 ? `<div style="text-align:center;padding:30px;color:var(--ink-soft);">Nenhum tópico em revisão! 🎯</div>` : items.map(item => createCard(item)).join('');
}

function renderRel() {
  let poolEd = CURSO_ATUAL ? EDITAL_ALL : [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let totaisFeitas = 0, totaisAcertos = 0, statsPorDisc = {};
  poolEd.forEach(item => {
    let stats = getTopicStats(item.id);
    totaisFeitas += stats.feitas; totaisAcertos += stats.acertos;
    if(!statsPorDisc[item.disc]) statsPorDisc[item.disc] = {feitas:0, acertos:0, qtd:0, conc:0};
    statsPorDisc[item.disc].feitas += stats.feitas; 
    statsPorDisc[item.disc].acertos += stats.acertos; 
    statsPorDisc[item.disc].qtd++;
    if(stats.feitas > 0 && (item.meta === 0 || stats.feitas >= item.meta)) statsPorDisc[item.disc].conc++;
  });
  let pctGeral = totaisFeitas > 0 ? Math.round((totaisAcertos / totaisFeitas) * 100) : 0;
  
  let rowsHtml = Object.keys(statsPorDisc).map(disc => {
    let d = statsPorDisc[disc];
    let p = d.qtd > 0 ? Math.round((d.conc / d.qtd) * 100) : 0;
    let acP = d.feitas > 0 ? Math.round((d.acertos/d.feitas)*100) : 0;
    return `<div class="topic-row"><span style="flex:1;font-weight:600;">${disc}</span><span style="font-family:var(--mono);font-size:11px;">${d.conc}/${d.qtd} ok</span><span class="bar-mini"><span class="bar-mini-fill" style="width:${p}%;"></span></span><span style="font-family:var(--mono);font-size:11px;font-weight:bold;width:45px;text-align:right;">${acP}% 🎯</span></div>`;
  }).join('');

  let todosCiclosGrafico = [...historicoCiclos, {
    ciclo: cicloAtualNum + ' (Atual)', feitas: totaisFeitas, acertos: totaisAcertos, erros: totaisFeitas - totaisAcertos, pct: pctGeral
  }];

  let chartBarsHtml = todosCiclosGrafico.map(c => {
    let barColor = c.pct >= 80 ? 'var(--green)' : (c.pct >= 60 ? 'var(--brass)' : 'var(--red)');
    let heightPct = Math.max(c.pct, 6);
    return `<div class="chart-col"><div class="chart-val">${c.pct}%</div><div class="chart-bar" style="height:${heightPct}%;background:${barColor};"></div><div class="chart-lbl">C#${c.ciclo}</div></div>`;
  }).join('');

  document.getElementById('content-rel').innerHTML = `
    <div class="topic-card" style="text-align:center;padding:20px;">
      <div style="font-family:var(--mono);font-size:12px;color:var(--ink-soft);">APROVEITAMENTO (CICLO #${cicloAtualNum})</div>
      <div class="score-num" style="font-size:48px;">${pctGeral}%</div>
      <div style="font-family:var(--mono);font-size:12px;font-weight:bold;color:var(--brass);">${totaisAcertos} ACERTOS DE ${totaisFeitas} FEITAS</div>
    </div>
    <div class="topic-card">
      <h3 style="font-family:var(--serif);margin-top:0;color:var(--brass-2);">📈 Gráfico de Evolução por Ciclo</h3>
      <div class="chart-box">${chartBarsHtml}</div>
    </div>
    <div class="topic-card" style="padding:16px;">
      <h3 style="font-family:var(--serif);margin-top:0;color:var(--brass-2);">📚 Desempenho por Matéria</h3>
      ${rowsHtml}
    </div>`;
}

function renderCalendario() {
  // Descobre todos os ciclos registrados (em andamento ou concluídos)
  let ciclos = new Set();
  for(let i = 1; i <= cicloAtualNum; i++) ciclos.add(i);
  
  historicoCiclos.forEach(hc => ciclos.add(hc.ciclo));
  Object.values(datasTopicos).forEach(dt => { if(dt.ciclo) ciclos.add(dt.ciclo); });

  let html = `
  <div class="topic-card">
    <h2 style="font-family:var(--serif);color:var(--brass-2);margin-top:0;">📅 Meus Ciclos de Estudo</h2>
    <p style="font-size:13px;color:var(--ink-soft);margin-bottom:16px;">Selecione um ciclo abaixo para ver os dias e as datas de realização dos tópicos.</p>
    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">`;
  
  Array.from(ciclos).sort((a,b) => a - b).forEach(c => {
      let isAtual = c === cicloAtualNum;
      html += `<button class="btn btn-primary" style="${isAtual ? 'background:var(--brass);border-color:var(--brass);' : 'background:var(--navy);'}" onclick="abrirCicloCalendario(${c})">🔄 Ciclo ${c} ${isAtual ? '(Atual)' : ''}</button>`;
  });
  
  html += `</div></div><div id="calendario-detalhes"></div>`;
  document.getElementById('content-calendario').innerHTML = html;
}

function abrirCicloCalendario(ciclo) {
  let html = `
  <div class="topic-card" style="margin-top:16px; border-top:4px solid var(--brass);">
     <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
         <h3 style="margin:0; color:var(--brass-2); font-family:var(--serif);">📅 Dias do Ciclo ${ciclo}</h3>
         <button class="btn" onclick="renderCalendario()">⬅ Voltar para Ciclos</button>
     </div>
     <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:16px;">`;
     
  for(let d = 1; d <= 7; d++) {
      html += `<button class="btn btn-primary" style="background:var(--navy);" onclick="abrirDiaCalendario(${ciclo}, ${d})">Dia ${d}</button>`;
  }
  html += `</div></div><div id="calendario-dia-detalhes"></div>`;
  
  document.getElementById('calendario-detalhes').innerHTML = html;
}

function abrirDiaCalendario(ciclo, dia) {
  let poolGeral = CURSO_ATUAL ? EDITAL_ALL : [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let topicosDoDia = poolGeral.filter(t => t.dia === dia);
  let hasData = false;
  
  let html = `
  <div class="topic-card" style="margin-top:16px; border-top:4px solid var(--green);">
     <h4 style="margin-top:0; color:var(--brass-2); font-family:var(--serif); font-size:18px;">Tópicos do Dia ${dia} (Ciclo ${ciclo})</h4>
     <div style="overflow-x:auto;">
       <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px; min-width:500px;">
         <thead>
           <tr style="border-bottom:2px solid var(--line); color:var(--ink-soft); font-family:var(--mono); text-transform:uppercase; font-size:11px;">
             <th style="padding:10px;">Matéria</th>
             <th style="padding:10px;">Tópico</th>
             <th style="padding:10px;">Início</th>
             <th style="padding:10px;">Término</th>
           </tr>
         </thead>
         <tbody>`;
  
  topicosDoDia.forEach(item => {
      let dt = datasTopicos[item.id];
      if(dt && dt.ciclo === ciclo) {
          hasData = true;
          let fimFormatado = dt.end ? formatDataBr(dt.end) : '<span style="color:var(--brass);">⏳ Em Andamento</span>';
          html += `
          <tr style="border-bottom:1px solid var(--line);">
            <td style="padding:10px; font-weight:600;">${item.disc}</td>
            <td style="padding:10px;">${item.topico}</td>
            <td style="padding:10px;">${formatDataBr(dt.start)}</td>
            <td style="padding:10px; font-weight:bold; color:${dt.end ? 'var(--green)' : 'inherit'};">${fimFormatado}</td>
          </tr>`;
      }
  });
  
  if(!hasData) {
      html += `<tr><td colspan="4" style="padding:20px; text-align:center; color:var(--ink-soft);">Nenhum tópico iniciado no Dia ${dia} do Ciclo ${ciclo}.</td></tr>`;
  }
  
  html += `</tbody></table></div></div>`;
  document.getElementById('calendario-dia-detalhes').innerHTML = html;
  
  // Rolar a tela suavemente para a tabela
  document.getElementById('calendario-dia-detalhes').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function formatDataBr(dataStr) {
  if(!dataStr) return '-';
  let p = dataStr.split('-');
  if(p.length === 3) return `${p[2]}/${p[1]}/${p[0]}`;
  return dataStr;
}

function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur === 'dark' ? '' : 'dark';
  if(next) document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
}

let simList = [], simPos = 0, simAnswers = {}, simFinished = false;
function initSimuladoSetup() {
  let pool = CURSO_ATUAL ? EDITAL_ALL : [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let disciplinas = [...new Set(pool.map(s => s.disc))];
  document.getElementById('sim-disc-list').innerHTML = disciplinas.map(d => `<label style="display:flex;align-items:center;gap:8px;font-size:14px;background:var(--card-bg2);padding:8px 12px;border:1px solid var(--line);border-radius:6px;"><input type="checkbox" class="sim-disc-chk" value="${d}" checked> ${d}</label>`).join('');
}

function startSimulado() {
  let selectedDiscs = Array.from(document.querySelectorAll('.sim-disc-chk:checked')).map(el => el.value);
  if(selectedDiscs.length === 0) { alert("Selecione pelo menos uma disciplina!"); return; }
  let qtd = parseInt(document.getElementById('sim-qtd').value);
  let pool = DB_QUESTOES_ALL.filter(q => selectedDiscs.includes(q.materia));
  if(pool.length === 0) { alert("Nenhuma questão cadastrada para os filtros atuais."); return; }
  simList = pool.sort(() => 0.5 - Math.random()).slice(0, qtd);
  simPos = 0; simAnswers = {}; simFinished = false;
  document.getElementById('setup-simulado').style.display = 'none';
  document.getElementById('run-simulado').style.display = 'block';
  renderSimRunView();
}

function selectSimOpt(id, idx) {
  if(simFinished) return;
  const q = simList.find(x => x.id === id);
  simAnswers[id] = { selected: idx, correct: (idx === q.correct) };
  renderSimRunView();
}
function simNext() { if(simPos < simList.length - 1) { simPos++; renderSimRunView(); } }
function simPrev() { if(simPos > 0) { simPos--; renderSimRunView(); } }
function finishSimulado() { simFinished = true; renderSimRunView(); }
function exitSimulado() { document.getElementById('setup-simulado').style.display = 'block'; document.getElementById('run-simulado').style.display = 'none'; }

function renderSimRunView() {
  if(simFinished) {
    let acertos = 0; simList.forEach(q => { if(simAnswers[q.id]?.correct) acertos++; });
    let pct = Math.round((acertos / simList.length) * 100);
    document.getElementById('simulado-content').innerHTML = `<div class="topic-card" style="text-align:center;"><h2>Resultado: ${pct}% (${acertos}/${simList.length})</h2><button class="btn btn-primary" onclick="exitSimulado()">Voltar</button></div>`;
    return;
  }
  const q = simList[simPos]; const ans = simAnswers[q.id]; const LETTERS = ['A','B','C','D','E'];
  let optsHtml = q.opts.map((opt, i) => `<div class="opt-row"><button class="opt-btn" style="${ans?.selected === i ? 'border-color:var(--brass);background:var(--mnemo-bg);' : ''}" onclick="selectSimOpt(${q.id}, ${i})"><span class="opt-letter">${LETTERS[i]}</span>${opt}</button></div>`).join('');
  document.getElementById('simulado-content').innerHTML = `<div class="topic-card"><div style="display:flex;justify-content:space-between;margin-bottom:12px;"><button class="btn" onclick="exitSimulado()">✖ Sair</button><button class="btn btn-primary" onclick="finishSimulado()">✅ Finalizar</button></div><div class="q-meta-top"><span class="pill pill-disc">${q.materia}</span><span class="pill">Q ${simPos+1}/${simList.length}</span></div><p class="q-text">${q.q}</p>${optsHtml}<div style="display:flex;justify-content:space-between;margin-top:16px;"><button class="btn" onclick="simPrev()" ${simPos===0?'disabled':''}>← Anterior</button><button class="btn" onclick="simNext()" ${simPos===simList.length-1?'disabled':''}>Próxima →</button></div></div>`;
}

window.addEventListener('DOMContentLoaded', () => {
  verificarPrimeiroAcesso();
  verificarAtualizacaoAutomatica();
  showMainView('trilha');
});

function tornarQuestaoImpossivel(id) {
  [DB_QUESTOES_ALL, cadernoAcertos, cadernoErros].forEach(list => {
    let q = list.find(x => x.id === id);
    if(q) q.nivel = 4;
  });
  saveState();
  renderQuizView();
  alert("🔥 Questão marcada como Nível 4 (Impossível)!");
}

function renderizarMatematica() {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        {left: '$$', right: '$$', display: true},
        {left: '$', right: '$', display: false},
        {left: '\\(', right: '\\)', display: false},
        {left: '\\[', right: '\\]', display: true}
      ],
      throwOnError: false
    });
  }
}

async function atualizarContadorQuestoesCard(topicoId, elementoId) {
  let poolEd = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
  let itemAtual = poolEd.find(e => e.id === topicoId);
  let idsParaBuscar = [topicoId];
  if (itemAtual && itemAtual.equivalente_id) {
    idsParaBuscar = poolEd.filter(e => e.equivalente_id === itemAtual.equivalente_id).map(e => e.id);
  }

  try {
    let idsQuery = idsParaBuscar.join(',');
    let res = await fetch(`${SUPABASE_URL}/rest/v1/questoes?topico_id=in.(${idsQuery})&select=id`, {
      method: 'GET',
      headers: { 
        'apikey': SUPABASE_ANON_KEY, 
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Range': '0-999'
      }
    });
    let dados = await res.json();
    if(!Array.isArray(dados)) return;

    let pendentes = dados.filter(q => !isQuestionArchived(q.id)).length;
    
    let el = document.getElementById(elementoId);
    if(el) {
      el.innerText = `📝 Questões (${pendentes})`;
    }
  } catch(e) {
    console.error("Erro ao contar questões:", e);
  }
}

const EDITAIS_CUSTOM_KEY = 'cbmpe_editais_custom_v1';
let editaisCustomizados = JSON.parse(localStorage.getItem(EDITAIS_CUSTOM_KEY)) || [];

const _carregarEditalOriginal = carregarEdital;
carregarEdital = function() {
  if(CURSO_ATUAL === 'CBMPE' || CURSO_ATUAL === 'CBMGO') {
    _carregarEditalOriginal();
  } else {
    let editalCustom = editaisCustomizados.find(e => e.id === CURSO_ATUAL);
    if(editalCustom) {
      EDITAL_ALL = editalCustom.topicos;
      DAY_TITLES = {};
      for(let i=1; i<=7; i++) DAY_TITLES[i] = `Dia ${i} — ${editalCustom.titulo}`;
      
      let headerTitle = document.getElementById('app-main-title');
      if(headerTitle) headerTitle.innerText = `🎯 ${editalCustom.titulo} — App`;
      
      let badgeEl = document.getElementById('badge-concurso-ativo');
      if(badgeEl) badgeEl.innerText = `🎯 ${editalCustom.titulo}`;

      EDITAL_ALL.forEach(item => {
        if (customMeta[item.id] !== undefined) item.meta = customMeta[item.id];
      });
    }
  }
};

function renderizarBotoesEditais() {
  let container = document.getElementById('lista-botoes-editais');
  if(!container) return;
  
  let html = `
    <button class="btn btn-primary" style="padding: 14px; font-size: 15px; background: var(--navy);" onclick="selecionarTrilha('CBMPE')">🚒 CFO CBMPE (Pernambuco)</button>
    <button class="btn btn-primary" style="padding: 14px; font-size: 15px; background: var(--brass); border-color: var(--brass);" onclick="selecionarTrilha('CBMGO')">🚒 CFO CBMGO (Goiás)</button>
  `;

  editaisCustomizados.forEach(edital => {
    html += `<button class="btn btn-primary" style="padding: 14px; font-size: 15px; background: var(--green); border-color: var(--green);" onclick="selecionarTrilha('${edital.id}')">📚 ${edital.titulo}</button>`;
  });

  container.innerHTML = html;
}

setTimeout(renderizarBotoesEditais, 500);

function abrirGerenciadorEditais() {
  document.getElementById('modal-gerenciador-editais').style.display = 'flex';
  mudarTabEdital('novo');
}

function fecharGerenciadorEditais() {
  document.getElementById('modal-gerenciador-editais').style.display = 'none';
  renderizarBotoesEditais();
}

function mudarTabEdital(tab) {
  document.getElementById('tab-novo-edital').style.display = tab === 'novo' ? 'block' : 'none';
  document.getElementById('tab-editar-topicos').style.display = tab === 'editar' ? 'block' : 'none';
  document.getElementById('tab-sincronizar-topicos').style.display = tab === 'sincronizar' ? 'block' : 'none';

  document.getElementById('btn-tab-novo-edital').className = tab === 'novo' ? 'btn btn-primary' : 'btn';
  document.getElementById('btn-tab-editar-topicos').className = tab === 'editar' ? 'btn btn-primary' : 'btn';
  document.getElementById('btn-tab-sincronizar').className = tab === 'sincronizar' ? 'btn btn-primary' : 'btn';

  if(tab === 'editar' || tab === 'sincronizar') popularSelectsGerenciador();
}

function salvarNovoEdital() {
  let titulo = document.getElementById('input-novo-edital-titulo').value.trim();
  let rawPlanilha = document.getElementById('input-novo-edital-planilha').value.trim();
  
  if(!titulo || !rawPlanilha) {
    alert("Preencha o título e cole os dados da planilha!");
    return;
  }

  let linhas = rawPlanilha.split('\n');
  let topicos = [];
  let nextId = Date.now();

  linhas.forEach(linha => {
    let colunas = linha.split('\t');
    if(colunas.length >= 3) {
      topicos.push({
        id: nextId++,
        dia: parseInt(colunas[0].trim()) || 1,
        disc: colunas[1].trim(),
        topico: colunas[2].trim(),
        meta: 10,
        equivalente_id: `custom_${nextId}`
      });
    }
  });

  if(topicos.length === 0) {
    alert("Nenhum tópico válido encontrado. Verifique se copiou corretamente do Excel (separado por colunas).");
    return;
  }

  let novoEdital = {
    id: 'EDITAL_' + Date.now(),
    titulo: titulo,
    topicos: topicos
  };

  editaisCustomizados.push(novoEdital);
  localStorage.setItem(EDITAIS_CUSTOM_KEY, JSON.stringify(editaisCustomizados));
  
  // DISPARA A SINCRONIZAÇÃO GERAL IMEDIATAMENTE
  salvarConteudoGlobalNaNuvem();
  
  alert(`✅ Edital "${titulo}" adicionado e enviado para a nuvem para todos os amigos!`);
  document.getElementById('input-novo-edital-titulo').value = '';
  document.getElementById('input-novo-edital-planilha').value = '';
  renderizarBotoesEditais();
}

function popularSelectsGerenciador() {
  let options = `<option value="CBMPE">CFO CBMPE</option>
                 <option value="CBMGO">CFO CBMGO</option>`;
  
  editaisCustomizados.forEach(ed => {
    options += `<option value="${ed.id}">${ed.titulo}</option>`;
  });

  let selectEdit = document.getElementById('select-edital-editar');
  let syncA = document.getElementById('sync-edital-a');
  let syncB = document.getElementById('sync-edital-b');
  
  if(selectEdit) selectEdit.innerHTML = options;
  if(syncA) { syncA.innerHTML = options; popularTopicosSync('a'); }
  if(syncB) { syncB.innerHTML = options; popularTopicosSync('b'); }

  carregarTopicosEdicao();
}

function obterArrayEditalPorId(id) {
  if(id === 'CBMPE') return EDITAL_CBMPE;
  if(id === 'CBMGO') return EDITAL_CBMGO;
  let custom = editaisCustomizados.find(e => e.id === id);
  return custom ? custom.topicos : [];
}

function carregarTopicosEdicao() {
  let editalId = document.getElementById('select-edital-editar').value;
  let topicos = obterArrayEditalPorId(editalId);
  let container = document.getElementById('lista-topicos-edicao');
  
  let isCustom = editalId.startsWith('EDITAL_');
  let btnExcluirHtml = isCustom 
      ? `<button class="btn btn-danger" onclick="excluirEditalCompleto('${editalId}')">🗑️ Excluir Edital Inteiro</button>` 
      : `<div></div>`; // Espaço vazio se for edital padrão

  let html = `<div style="margin-bottom:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
    ${btnExcluirHtml}
    <button class="btn btn-primary" onclick="adicionarTopicoUnico('${editalId}')">➕ Adicionar Tópico</button>
  </div>`;

  html += topicos.map(t => `
    <div style="background:var(--card-bg2); padding:10px; border-radius:8px; border:1px solid var(--line); display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <input type="number" value="${t.dia}" class="form-control" style="width:60px;" onchange="atualizarTopico('${editalId}', ${t.id}, 'dia', this.value)">
      <input type="text" value="${t.disc}" class="form-control" style="width:160px;" onchange="atualizarTopico('${editalId}', ${t.id}, 'disc', this.value)">
      <input type="text" value="${t.topico}" class="form-control" style="flex:1; min-width:200px;" onchange="atualizarTopico('${editalId}', ${t.id}, 'topico', this.value)">
      <span class="pill" title="Sincronização">${t.equivalente_id || 'Sem Sync'}</span>
      <button class="btn btn-danger" style="margin:0; padding:8px;" onclick="excluirTopico('${editalId}', ${t.id})">🗑️</button>
    </div>
  `).join('');

  container.innerHTML = html;
}
function adicionarTopicoUnico(editalId) {
  let topicos = obterArrayEditalPorId(editalId);
  let novoId = Date.now();
  topicos.push({
    id: novoId,
    dia: 1,
    disc: "Nova Disciplina",
    topico: "Novo Tópico",
    meta: 10,
    equivalente_id: 'custom_' + novoId
  });
  salvarEditalAposEdicao(editalId);
  carregarTopicosEdicao();
}

function excluirTopico(editalId, topicoId) {
  if(!confirm("Deseja realmente excluir este tópico?")) return;
  let topicos = obterArrayEditalPorId(editalId);
  let index = topicos.findIndex(t => t.id === topicoId);
  if(index !== -1) {
    topicos.splice(index, 1);
    salvarEditalAposEdicao(editalId);
    carregarTopicosEdicao();
  }
}

function salvarEditalAposEdicao(editalId) {
  if(editalId.startsWith('EDITAL_')) {
    localStorage.setItem(EDITAIS_CUSTOM_KEY, JSON.stringify(editaisCustomizados));
    // Sincroniza qualquer alteração ou exclusão de tópicos para a nuvem
    salvarConteudoGlobalNaNuvem();
  } else {
    let chaveCache = editalId === 'CBMPE' ? 'cbmpe_cache_v1' : 'cbmgo_cache_v1';
    localStorage.setItem(chaveCache, JSON.stringify(obterArrayEditalPorId(editalId)));
  }
}

function atualizarTopico(editalId, topicoId, campo, valor) {
  let topicos = obterArrayEditalPorId(editalId);
  let topico = topicos.find(t => t.id === topicoId);
  if(topico) {
    if(campo === 'dia') topico[campo] = parseInt(valor);
    else topico[campo] = valor;
    
    salvarEditalAposEdicao(editalId);
  }
}

function popularTopicosSync(lado) {
  let editalId = document.getElementById(`sync-edital-${lado}`).value;
  let topicos = obterArrayEditalPorId(editalId);
  let select = document.getElementById(`sync-topico-${lado}`);
  
  select.innerHTML = topicos.map(t => `<option value="${t.id}">Dia ${t.dia} - ${t.disc}: ${t.topico}</option>`).join('');
}

function executarSincronizacao() {
  let editalAId = document.getElementById('sync-edital-a').value;
  let topicoAId = parseInt(document.getElementById('sync-topico-a').value);
  
  let editalBId = document.getElementById('sync-edital-b').value;
  let topicoBId = parseInt(document.getElementById('sync-topico-b').value);

  if(editalAId === editalBId && topicoAId === topicoBId) {
    alert("Você selecionou o mesmo tópico duas vezes!");
    return;
  }

  let topicosA = obterArrayEditalPorId(editalAId);
  let topicosB = obterArrayEditalPorId(editalBId);
  
  let topicoA = topicosA.find(t => t.id === topicoAId);
  let topicoB = topicosB.find(t => t.id === topicoBId);

  if(topicoA && topicoB) {
    let syncId = topicoA.equivalente_id;
    if(!syncId) {
      syncId = `sync_${Date.now()}`;
      topicoA.equivalente_id = syncId;
    }
    
    topicoB.equivalente_id = syncId;

    salvarEditalAposEdicao(editalAId);
    salvarEditalAposEdicao(editalBId);
    
    alert(`✅ Tópicos vinculados com sucesso! (ID Compartilhado: ${syncId})`);
    carregarTopicosEdicao();
  }
}

async function excluirEditalCompleto(editalId) {
  if(!editalId.startsWith('EDITAL_')) {
    alert("Não é possível excluir os editais padrão do sistema.");
    return;
  }

  let senha = prompt("⚠️ ATENÇÃO: Isto excluirá o edital para TODOS os utilizadores na nuvem.\n\nDigite a palavra-passe numérica (1 a 8) para confirmar:");
  
  if(senha === "12345678") {
    // 1. APAGA IMEDIATAMENTE LOCALMENTE PARA FEEDBACK INSTANTÂNEO
    editaisCustomizados = editaisCustomizados.filter(e => e.id !== editalId);
    localStorage.setItem(EDITAIS_CUSTOM_KEY, JSON.stringify(editaisCustomizados));

    // 2. Atualiza a tela na mesma hora (o botão some na hora!)
    popularSelectsGerenciador();
    renderizarBotoesEditais();

    if(CURSO_ATUAL === editalId) {
        voltarParaSeletorTrilha();
    }

    alert("🗑️ Edital apagado! A atualizar a nuvem em segundo plano...");

    // 3. VAI À NUVEM APAGAR EM SEGUNDO PLANO (Background)
    try {
        let resGlobal = await fetch(`${SUPABASE_URL}/rest/v1/app_conteudo?id=eq.global&select=dados`, {
          method: 'GET',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        
        let jsonGlobal = await resGlobal.json();
        let dadosNuvem = (jsonGlobal && jsonGlobal.length > 0 && jsonGlobal[0].dados) ? jsonGlobal[0].dados : {};
        
        // Mescla com a nuvem
        let editaisNuvem = dadosNuvem.editais || [];
        let mapEditais = new Map();
        
        editaisNuvem.forEach(e => mapEditais.set(e.id, e));
        editaisCustomizados.forEach(e => mapEditais.set(e.id, e)); // A lista local já não tem o apagado
        
        // Garante a 100% que o ID apagado é destruído na nuvem
        mapEditais.delete(editalId);
        
        let editaisFinais = Array.from(mapEditais.values());
        
        // Prepara o pacote limpo e envia
        let payload = { 
          id: 'global', 
          dados: { 
            questoes: DB_QUESTOES_ALL, 
            teoria: DB_TEORIA,
            editais: editaisFinais 
          }, 
          atualizado_em: new Date() 
        };
        
        await fetch(`${SUPABASE_URL}/rest/v1/app_conteudo`, {
          method: 'POST',
          headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' },
          body: JSON.stringify(payload)
        });

        // Só garante que a lista está igual à da nuvem se algum amigo tiver criado outro entretanto
        editaisCustomizados = editaisFinais;
        localStorage.setItem(EDITAIS_CUSTOM_KEY, JSON.stringify(editaisCustomizados));
        popularSelectsGerenciador();
        renderizarBotoesEditais();

    } catch (e) {
        console.error("Erro ao sincronizar exclusão com a nuvem:", e);
    }
  } else {
    if(senha !== null) alert("❌ Palavra-passe incorreta. Exclusão cancelada.");
  }
}

async function carregarListaAdminNuvem() {
    let container = document.getElementById('admin-lista-nuvem');
    container.innerHTML = '<div style="text-align:center; padding:10px; font-size:13px; color:var(--ink-soft);">A procurar utilizadores na nuvem...</div>';
    
    try {
        let res = await fetch(`${SUPABASE_URL}/rest/v1/app_ranking?select=usuario_id,nome`, {
            method: 'GET',
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        
        let usuarios = await res.json();

        if(!usuarios || usuarios.length === 0) {
            container.innerHTML = '<div style="color:var(--ink-soft);">Nenhum utilizador encontrado.</div>';
            return;
        }

        let html = '<div style="display:flex; flex-direction:column; gap:8px; margin-top:12px;">';
        usuarios.forEach(u => {
            let isEu = u.usuario_id === MEU_ID_USUARIO;
            html += `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--card-bg); padding:10px; border-radius:6px; border:1px solid ${isEu ? 'var(--brass)' : 'var(--line)'};">
                <div>
                    <strong style="color:var(--fg);">${u.nome} ${isEu ? '(Tu)' : ''}</strong> 
                    <span style="font-size:11px; color:var(--ink-soft); display:block;">@${u.usuario_id}</span>
                </div>
                <button class="btn btn-danger" style="padding:6px 10px; font-size:11px; margin:0;" onclick="excluirUsuarioNuvemDefinitivo('${u.usuario_id}', '${u.nome}')">🗑️ Apagar DB</button>
            </div>`;
        });
        html += '</div>';
        container.innerHTML = html;
        
    } catch (e) {
        container.innerHTML = '<div style="color:var(--red);">Erro ao carregar lista de utilizadores.</div>';
    }
}

async function excluirUsuarioNuvemDefinitivo(alvoId, alvoNome) {
    let senha = prompt(`⚠️ ATENÇÃO EXTREMA: Vais apagar o utilizador "${alvoNome}" (@${alvoId}) definitivamente da Nuvem (Progresso, Cadernos e Ranking).\n\nDigita a palavra-passe numérica (1 a 8) para executar:`);
    
    if(senha === "12345678") {
        try {
            // 1. Apaga do Ranking
            await fetch(`${SUPABASE_URL}/rest/v1/app_ranking?usuario_id=eq.${alvoId}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });
            
            // 2. Apaga do Progresso
            await fetch(`${SUPABASE_URL}/rest/v1/app_progresso?usuario_id=eq.${alvoId}`, {
                method: 'DELETE',
                headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
            });

            // 3. Remove também da lista local de atalhos, caso esteja gravado no telemóvel
            let perfis = getPerfisSalvos();
            perfis = perfis.filter(p => p.id !== alvoId);
            localStorage.setItem('cbmpe_perfis_salvos', JSON.stringify(perfis));

            if (alvoId === MEU_ID_USUARIO) {
                // Se a pessoa se apagou a si própria...
                localStorage.removeItem('cbmpe_meu_id');
                localStorage.removeItem('cbmpe_nome_usuario');
                alert("Apagaste a tua própria conta da nuvem. O sistema vai reiniciar.");
                window.location.reload();
            } else {
                alert(`✅ Utilizador ${alvoNome} erradicado da base de dados!`);
                carregarListaAdminNuvem(); // Atualiza a lista na hora
            }
            
        } catch(e) {
            alert("Erro ao excluir o utilizador na nuvem.");
            console.error(e);
        }
    } else {
        if(senha !== null) alert("❌ Palavra-passe incorreta. Exclusão cancelada.");
    }
}

// Monitoramento inteligente de entrada e saída do app
window.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // 🚨 SALVAMENTO DE EMERGÊNCIA: O utilizador minimizou o app ou desligou a tela!
    // Dispara o envio para a nuvem instantaneamente, ignorando o cronômetro de 1.5s
    if(MEU_ID_USUARIO) {
        console.log("App minimizado: Forçando envio imediato para a nuvem...");
        salvarProgressoIndividualNaNuvem();
        enviarPlacarParaRanking();
    }
  } 
  else if (document.visibilityState === 'visible' && MEU_ID_USUARIO) {
    // 🔄 ATUALIZAÇÃO AUTOMÁTICA: O utilizador voltou a olhar para a tela
    let telaQuizAberta = document.getElementById('view-quiz') && document.getElementById('view-quiz').style.display === 'block';
    
    if (!telaQuizAberta) {
       console.log("App reativado: Buscando atualizações...");
       baixarDadosDaNuvem();
    }
  }
});

// Segurança extra caso o usuário feche a aba completamente de uma vez
window.addEventListener('beforeunload', () => {
    if(MEU_ID_USUARIO) {
        salvarProgressoIndividualNaNuvem();
    }
});

// ==========================================
// SISTEMA DE META DIÁRIA (WIDGET FLUTUANTE)
// ==========================================
let metaDiariaQtd = parseInt(localStorage.getItem('cbmpe_meta_diaria')) || 50;

function calcularProgressoDiario() {
    let hoje = new Date();
    let hojeAno = hoje.getFullYear();
    let hojeMes = hoje.getMonth();
    let hojeDia = hoje.getDate();
    
    let feitasHoje = 0;

    let contarSeHoje = (q) => {
        if (!q.timestamp) return false;
        let d = new Date(q.timestamp);
        // Compara Dia, Mês e Ano de forma isolada, à prova de fusos horários
        return d.getDate() === hojeDia && d.getMonth() === hojeMes && d.getFullYear() === hojeAno;
    };

    feitasHoje += cadernoAcertos.filter(contarSeHoje).length;
    feitasHoje += cadernoErros.filter(contarSeHoje).length;

    return feitasHoje;
}

function inicializarWidgetMeta() {
   if(document.getElementById('widget-meta-diaria')) return; 
   
   // Injeta o HTML e o CSS do widget diretamente na tela
   let widgetHtml = `
   <div id="widget-meta-diaria" style="position:fixed; bottom:20px; right:20px; background:var(--card-bg); border:2px solid var(--brass); border-radius:12px; padding:10px 14px; display:flex; align-items:center; gap:12px; box-shadow:0 6px 15px rgba(0,0,0,0.6); z-index:9999; cursor:pointer; transition:all 0.3s ease;" onclick="configurarMetaDiaria()" title="Clica para alterar a tua Meta Diária">
      <div id="meta-ring" style="width:50px; height:50px; border-radius:50%; display:flex; align-items:center; justify-content:center; background: conic-gradient(var(--brass) 0%, var(--card-bg2) 0%); transition: background 0.3s;">
        <div id="meta-inner-circle" style="width:40px; height:40px; background:var(--card-bg); border-radius:50%; display:flex; align-items:center; justify-content:center; transition:background 0.3s;">
            <span id="meta-texto-progresso" style="font-family:var(--mono); font-size:12px; font-weight:bold; color:var(--fg);">0/0</span>
        </div>
      </div>
      <div id="meta-label" style="font-family:var(--serif); font-size:16px; font-weight:bold; color:var(--brass-2);">Meta Hoje</div>
   </div>`;
   
   document.body.insertAdjacentHTML('beforeend', widgetHtml);
   atualizarWidgetMeta();
}

function atualizarWidgetMeta() {
    let widget = document.getElementById('widget-meta-diaria');
    if(!widget) return;

    let feitasHoje = calcularProgressoDiario();
    let ring = document.getElementById('meta-ring');
    let inner = document.getElementById('meta-inner-circle');
    let texto = document.getElementById('meta-texto-progresso');
    let label = document.getElementById('meta-label');
    
    // Cálculo do anel (em graus/porcentagem)
    let pct = metaDiariaQtd > 0 ? Math.min(100, Math.round((feitasHoje / metaDiariaQtd) * 100)) : 100;
    texto.innerText = `${feitasHoje}/${metaDiariaQtd}`;
    
    // Animação de quando a meta é batida
    if (feitasHoje >= metaDiariaQtd) {
        widget.style.borderColor = 'var(--green)';
        ring.style.background = 'var(--green)'; 
        inner.style.background = 'var(--green)';
        texto.style.color = '#fff';
        label.innerText = '🔥 Meta Batida!';
        label.style.color = 'var(--green)';
    } else {
        widget.style.borderColor = 'var(--brass)';
        ring.style.background = `conic-gradient(var(--brass) ${pct}%, var(--card-bg2) 0%)`;
        inner.style.background = 'var(--card-bg)';
        texto.style.color = 'var(--fg)';
        label.innerText = 'Meta Hoje';
        label.style.color = 'var(--brass-2)';
    }
}

function configurarMetaDiaria() {
    let novaMeta = prompt(`🎯 DEFINE A TUA META DIÁRIA:\n\nQuantas questões planeias responder por dia? (Atual: ${metaDiariaQtd})`, metaDiariaQtd);
    if (novaMeta !== null && !isNaN(novaMeta) && parseInt(novaMeta) > 0) {
        metaDiariaQtd = parseInt(novaMeta);
        localStorage.setItem('cbmpe_meta_diaria', metaDiariaQtd);
        atualizarWidgetMeta();
    }
}

// Inicia o widget 1 segundo após o app carregar (dá tempo de baixar os dados da nuvem)
setTimeout(inicializarWidgetMeta, 1000);

// ==========================================
// INTEGRAÇÃO DIRETA COM A API DO GEMINI
// ==========================================

async function chamarGeminiAPI(promptText) {
    let apiKey = localStorage.getItem('cbmpe_gemini_key');
    if(!apiKey) {
        alert("⚠️ Precisas de configurar a tua Chave API do Gemini na aba 'Perfil'!");
        return null;
    }

    let selectModelo = document.getElementById('select-modelo-ia');
    let modeloEscolhido = selectModelo ? selectModelo.value : 'gemini-1.5-flash';

    try {
        let response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modeloEscolhido}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.7 }
            })
        });

        let data = await response.json();
        
        if (data.error) throw new Error(data.error.message);
        if (!data.candidates || !data.candidates[0].content) throw new Error("A IA devolveu uma resposta vazia.");
        
        return data.candidates[0].content.parts[0].text;
    } catch(e) {
        console.error("Erro detalhado da API:", e);
        alert("Falha na IA: " + e.message);
        return null;
    }
}

async function gerarResumoIA() {
    let topicoId = parseInt(document.getElementById('edit-res-id').value);
    let poolEd = getTodosTopicosGlobais();
    let topicoInfo = poolEd.find(t => t.id === topicoId);
    if(!topicoInfo) return;

    // Vai buscar o prompt que o utilizador editou no modal
    let instrucoesCustomizadas = document.getElementById('prompt-custom-resumo').value;

    fecharModalResumo();
    mostrarNotificacao(`A gerar resumo para: <b>${topicoInfo.topico}</b>...`, 'info');

    try {
        // Junta o tema do tópico com as instruções da caixa de texto
        let promptFinal = `Tema obrigatório: "${topicoInfo.disc} - ${topicoInfo.topico}"\n\n${instrucoesCustomizadas}`;

        let resposta = await chamarGeminiAPI(promptFinal);
        
        if(resposta) {
            resposta = resposta.replace(/^```html\s*/i, '').replace(/\s*```$/i, '').trim();
            DB_TEORIA[topicoId] = resposta;
            saveState();
            
            if(document.getElementById('view-topicos').style.display === 'block') {
                renderFilteredTopics();
            }
            mostrarNotificacao("Resumo gerado e salvo automaticamente!", "sucesso");
        }
    } catch (erro) {
        console.error("Erro interno ao gerar resumo:", erro);
        mostrarNotificacao("Ocorreu um erro ao gerar o resumo.", "erro");
    }
}

window.gerarQuestoesIA = async function gerarQuestoesIA() {
    let inputTopico = document.getElementById('imp-topico-num');
    let spanTopico = document.getElementById('imp-topico-id');
    
    let topicoId = window._topicoIdAtual 
                || (inputTopico ? parseInt(inputTopico.value) : null) 
                || (spanTopico ? parseInt(spanTopico.innerText) : null);
    
    if (!topicoId || isNaN(topicoId)) {
        mostrarNotificacao("Erro: Nenhum tópico selecionado.", "erro");
        return;
    }

    let poolEd = getTodosTopicosGlobais();
    let topicoInfo = poolEd.find(t => Number(t.id) === Number(topicoId));
    
    if(!topicoInfo) {
        mostrarNotificacao("Tópico ativo não encontrado na base de dados.", "erro");
        return;
    }

    let instrucoesCustomizadas = document.getElementById('prompt-custom-questoes').value;

    fecharModalImportar();
    mostrarNotificacao(`A criar questões para: <b>${topicoInfo.topico}</b>...`, 'info');

    try {
        let promptFinal = `Tema obrigatório: "${topicoInfo.disc} - ${topicoInfo.topico}".\n\nInstruções de Geração:\n${instrucoesCustomizadas}`;
        let resposta = await chamarGeminiAPI(promptFinal);
        
        if (resposta) {
            let raw = resposta.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            let parsed = JSON.parse(raw);
            
            if(!Array.isArray(parsed)) throw new Error("Formato inválido.");

            let materiaPadrao = topicoInfo.disc || "Geral";

            let novasQuestoesSupabase = parsed.map(q => ({
                topico_id: topicoId,
                materia: q.materia || materiaPadrao,
                banca: q.banca || "AOCP",
                nivel: q.nivel ?? 2,
                enunciado: q.q,
                alternativas: q.opts,
                gabarito: q.correct,
                explicacao: q.expl
            }));

            let res = await fetch(`${SUPABASE_URL}/rest/v1/questoes`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(novasQuestoesSupabase)
            });

            if (!res.ok) throw new Error("Erro no banco de dados.");

            if(document.getElementById('view-topicos').style.display === 'block') {
                renderFilteredTopics();
            }
            mostrarNotificacao("5 Questões criadas e importadas com sucesso!", "sucesso");
        }
    } catch (erro) {
        console.error("Erro no gerarQuestoesIA:", erro);
        mostrarNotificacao("Erro ao comunicar com a IA e importar as questões.", "erro");
    }
}
// ==========================================
// FUNÇÃO DE SALVAR O PERFIL (ATUALIZADA COM CHAVE API)
// ==========================================
function salvarPerfilUsuario() {
  // Vai buscar os valores das caixas de texto
  let novoNome = document.getElementById('input-meu-nome').value.trim();
  let novoId = document.getElementById('input-meu-id').value.trim().toLowerCase().replace(/\s+/g, '_');
  
  // Tenta ir buscar a chave da API (se a caixa de texto existir)
  let inputChave = document.getElementById('input-gemini-key');
  let novaChave = inputChave ? inputChave.value.trim() : ''; 
  
  if(!novoNome || !novoId) { 
      alert("Preencha todos os campos obrigatórios (Nome e ID)!"); 
      return; 
  }

  // Guarda no LocalStorage do navegador
  localStorage.setItem('cbmpe_nome_usuario', novoNome);
  MEU_ID_USUARIO = novoId;
  localStorage.setItem('cbmpe_meu_id', MEU_ID_USUARIO);
  
  if (inputChave) {
      localStorage.setItem('cbmpe_gemini_key', novaChave);
  }

  alert("✅ Perfil e Chave API salvos com sucesso!");
  baixarDadosDaNuvem();
  showMainView('trilha');
}

async function tentarGerarComIAForcado() {
    console.log("⚡ Botão acionado por chamada direta!");

    let inputTopico = document.getElementById('imp-topico-num');
    let topicoId = inputTopico ? parseInt(inputTopico.value) : null;

    if (!topicoId || isNaN(topicoId)) {
        alert("⚠️ Erro crítico: Nenhum ID de tópico foi encontrado no modal!");
        return;
    }

    // Procura o tópico em todas as fontes possíveis do edital ativo ou customizado
    let poolEd = [...(typeof EDITAL_CBMPE !== 'undefined' ? EDITAL_CBMPE : []), ...(typeof EDITAL_CBMGO !== 'undefined' ? EDITAL_CBMGO : []), ...(typeof EDITAL_ALL !== 'undefined' ? EDITAL_ALL : [])];
    if (typeof editaisCustomizados !== 'undefined') {
        editaisCustomizados.forEach(ed => {
            if (ed.topicos && Array.isArray(ed.topicos)) poolEd = poolEd.concat(ed.topicos);
        });
    }

    let topicoInfo = poolEd.find(t => t.id === topicoId);

    if(!topicoInfo) {
        alert("⚠️ Tópico ID " + topicoId + " não foi localizado na memória dos editais.");
        return;
    }

    let promptEl = document.getElementById('prompt-custom-questoes');
    let instrucoesCustomizadas = promptEl ? promptEl.value : "Crie 5 questões.";
    let promptFinal = `Tema obrigatório: "${topicoInfo.disc} - ${topicoInfo.topico}".\n\nInstruções de Geração:\n${instrucoesCustomizadas}`;

    alert("A contactar a IA para o tópico: " + topicoInfo.topico);

    let resposta = await chamarGeminiAPI(promptFinal);
    if (resposta) {
        resposta = resposta.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
        let caixaTexto = document.getElementById('adm-massa-texto');
        if (caixaTexto) {
            caixaTexto.value = resposta;
            alert("✅ Questões geradas com sucesso!");
        }
    }
}



function getTodosTopicosGlobais() {
    let pool = [...EDITAL_CBMPE, ...EDITAL_CBMGO];
    if (typeof editaisCustomizados !== 'undefined') {
        editaisCustomizados.forEach(ed => {
            if (ed.topicos) pool = pool.concat(ed.topicos);
        });
    }
    return pool;
}

function mostrarNotificacao(mensagem, tipo = 'sucesso') {
    // 1. Cria o container no canto superior direito se ele não existir
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = 'position:fixed; top:70px; right:20px; z-index:9999; display:flex; flex-direction:column; gap:10px; pointer-events:none;';
        document.body.appendChild(container);
    }

    // 2. Configura as cores e ícones baseados no tipo da notificação
    let corBorda = tipo === 'sucesso' ? 'var(--green)' : (tipo === 'erro' ? 'var(--red)' : 'var(--brass)');
    let icone = tipo === 'sucesso' ? '✅' : (tipo === 'erro' ? '❌' : '⏳');

    // 3. Cria o elemento da notificação com o design do seu app
    let toast = document.createElement('div');
    toast.style.cssText = `
        background: var(--card-bg);
        border-left: 4px solid ${corBorda};
        border-radius: 8px;
        box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        padding: 12px 16px;
        color: var(--fg);
        font-family: var(--sans);
        font-size: 13.5px;
        display: flex;
        align-items: center;
        gap: 12px;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        max-width: 320px;
        pointer-events: auto;
    `;

    toast.innerHTML = `<span style="font-size:18px;">${icone}</span> <span style="line-height:1.4;">${mensagem}</span>`;
    container.appendChild(toast);

    // 4. Anima a entrada
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    });

    // 5. Remove automaticamente após 4 segundos
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

// Utilitário para importar transações do histórico do C6 Bank
import { Transaction } from '../types'

interface RawTransaction {
  description: string
  date: string
  amount: string
  card: string
}

// Função para extrair dados do texto do C6 Bank ou Google Pay
export function parseC6BankText(text: string): RawTransaction[] {
  const lines = text.split('\n').filter(line => line.trim())
  const transactions: RawTransaction[] = []
  
  // Tentar formato C6 Bank (4 linhas por transação)
  if (lines.length % 4 === 0 && lines.some(line => line.includes('Cartão C6'))) {
    for (let i = 0; i < lines.length; i += 4) {
      if (i + 3 < lines.length) {
        const description = lines[i].trim()
        const date = lines[i + 1].trim()
        const amount = lines[i + 2].trim()
        const card = lines[i + 3].trim()
        
        // Verificar se é uma transação válida
        if (description && date && amount.includes('R$') && card) {
          transactions.push({
            description,
            date,
            amount,
            card
          })
        }
      }
    }
  } else {
    // Tentar formato Google Pay (linhas mais variadas)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Procurar por valores em R$
      if (line.includes('R$') && line.match(/R\$\s*\d+[,.]?\d*/)) {
        const amount = line
        
        // Procurar descrição nas linhas anteriores
        let description = ''
        let date = ''
        let card = 'Google Pay'
        
        // Buscar descrição (linha anterior que não é valor)
        for (let j = Math.max(0, i - 3); j < i; j++) {
          const prevLine = lines[j].trim()
          if (prevLine && !prevLine.includes('R$') && !prevLine.match(/^\d+/) && 
              !prevLine.match(/^(sáb|dom|seg|ter|qua|qui|sex)\.?$/) &&
              !prevLine.match(/^\d+\s+de\s+\w+/) &&
              prevLine.length > 3) {
            description = prevLine
            break
          }
        }
        
        // Buscar data (pode estar em várias linhas anteriores)
        for (let j = Math.max(0, i - 5); j < i; j++) {
          const prevLine = lines[j].trim()
          if (prevLine.match(/^(sáb|dom|seg|ter|qua|qui|sex)\.?$/) || 
              prevLine.match(/^\d+\s+de\s+\w+/) ||
              prevLine.match(/^\d+\s+de\s+\w+\s+de\s+\d{4}/)) {
            date = prevLine
            break
          }
        }
        
        // Se não encontrou data específica, usar data genérica
        if (!date) {
          date = 'Hoje'
        }
        
        if (description && amount) {
          transactions.push({
            description,
            date,
            amount,
            card
          })
        }
      }
    }
  }
  
  return transactions
}

// Função para categorizar automaticamente baseado na descrição
function categorizeTransaction(description: string): string {
  const desc = description.toLowerCase()
  
  // Alimentação
  if (desc.includes('padaria') || desc.includes('mercado') || desc.includes('supermercado') || 
      desc.includes('mercadinho') || desc.includes('mercadão') || desc.includes('ifood') ||
      desc.includes('restaurante') || desc.includes('churrascaria') || desc.includes('bar') ||
      desc.includes('frituras') || desc.includes('pescada') || desc.includes('delicia') ||
      desc.includes('confeitaria') || desc.includes('comercial') || desc.includes('budega') ||
      desc.includes('criolo') || desc.includes('centerbox') || desc.includes('vr') ||
      desc.includes('zp') || desc.includes('joumar') || desc.includes('francisca') ||
      desc.includes('g r ribeiro') || desc.includes('joaoalberto') || desc.includes('rochely') ||
      desc.includes('tortele') || desc.includes('sempre viva') || desc.includes('pronto mercado') ||
      desc.includes('mundo verde') || desc.includes('agropet') || desc.includes('cobasi') ||
      desc.includes('dominguinho') || desc.includes('chegue bar') || desc.includes('fuzue bar') ||
      desc.includes('vani frituras') || desc.includes('jairo pescada') || desc.includes('churrascaria picui') ||
      desc.includes('mercadinho da praia') || desc.includes('mercadinho abreu')) {
    return 'Alimentação'
  }
  
  // Transporte
  if (desc.includes('posto') || desc.includes('gasolina') || desc.includes('star posto') ||
      desc.includes('posto aliança') || desc.includes('posto sao domingos')) {
    return 'Transporte'
  }
  
  // Saúde
  if (desc.includes('droga raia') || desc.includes('farmacia') || desc.includes('medico') ||
      desc.includes('dentista') || desc.includes('saude')) {
    return 'Saúde'
  }
  
  // Educação
  if (desc.includes('centro de formacao') || desc.includes('formacao') || desc.includes('educacao') ||
      desc.includes('curso') || desc.includes('escola')) {
    return 'Educação'
  }
  
  // Serviços
  if (desc.includes('barber') || desc.includes('cabeleireiro') || desc.includes('servico') ||
      desc.includes('silveira') || desc.includes('manutencao')) {
    return 'Serviços'
  }
  
  // Assinaturas
  if (desc.includes('internet') || desc.includes('streaming') || desc.includes('assinatura') ||
      desc.includes('netflix') || desc.includes('spotify') || desc.includes('prime')) {
    return 'Assinaturas'
  }
  
  // Investimentos
  if (desc.includes('loterias') || desc.includes('caixa') || desc.includes('investimento') ||
      desc.includes('acoes') || desc.includes('fundo')) {
    return 'Investimentos'
  }
  
  // Outros
  return 'Outros'
}

// Função para converter data do formato C6/Google Pay para Date
function parseC6Date(dateStr: string): Date {
  const now = new Date()
  const currentYear = now.getFullYear()
  
  // Remover "de 2024" se presente
  const cleanDate = dateStr.replace(' de 2024', '').trim()
  
  // Mapear meses
  const monthMap: { [key: string]: number } = {
    'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
    'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11
  }
  
  // Formato: "13 de set." ou "13 de set"
  if (cleanDate.includes(' de ')) {
    const [day, month] = cleanDate.split(' de ')
    const dayNum = parseInt(day)
    const monthNum = monthMap[month.replace('.', '')]
    
    if (dayNum && monthNum !== undefined) {
      return new Date(currentYear, monthNum, dayNum)
    }
  }
  
  // Formato: "sáb.", "ter.", "qui." etc
  if (cleanDate.includes('.')) {
    // Para dias da semana, usar uma data recente (últimos 30 dias)
    const now = new Date()
    const randomDaysAgo = Math.floor(Math.random() * 30) + 1 // 1-30 dias atrás
    const pastDate = new Date(now.getTime() - (randomDaysAgo * 24 * 60 * 60 * 1000))
    return pastDate
  }
  
  // Para "Hoje" ou outras strings genéricas
  if (cleanDate.toLowerCase() === 'hoje' || cleanDate === '') {
    return new Date()
  }
  
  // Fallback para data atual
  return new Date()
}

// Função para extrair valor numérico
function parseAmount(amountStr: string): number {
  const cleanAmount = amountStr.replace('R$', '').replace('.', '').replace(',', '.').trim()
  return parseFloat(cleanAmount) || 0
}

// Função principal para converter dados C6 para formato do app
export function convertC6ToTransactions(rawData: RawTransaction[]): Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>[] {
  return rawData.map((raw, index) => {
    const amount = parseAmount(raw.amount)
    const category = categorizeTransaction(raw.description)
    
    return {
      description: raw.description,
      amount: amount,
      type: 'expense' as const,
      category: category,
      status: 'paid' as const,
      date: parseC6Date(raw.date).toISOString(),
      accountId: 'default-account', // Será substituído pelo ID real da conta
      notes: `Importado do C6 Bank - ${raw.card}`,
      tags: ['importado', 'c6-bank'],
      aiCategorized: true,
      aiConfidence: 0.8,
      aiExplanation: `Categorizado automaticamente como ${category} baseado na descrição`
    }
  })
}

// Função para criar dados de exemplo
export function createSampleTransactions(): Omit<Transaction, '_id' | 'userId' | 'createdAt' | 'updatedAt'>[] {
  const sampleData = `
Padaria Ideal
sáb.
R$ 19,15
Cartão C6 Carbon Mastercard •••• 5573

Centerbox
sáb.
R$ 46,27
Cartão C6 Carbon Mastercard •••• 5573

VRMB COMERCIO DE ALIME
qui.
R$ 85,03
Cartão C6 Carbon Mastercard •••• 5573

ZP*JAG RESTAURANTES E
ter.
R$ 71,38
Cartão C6 Carbon Mastercard •••• 5573

MercadoLibre
13 de set.
R$ 10,00
Cartão C6 Carbon Mastercard •••• 5573

CENTRO DE FORMACAO CAP
13 de set.
R$ 4,90
Cartão C6 Carbon Mastercard •••• 5573

CENTRO DE FORMACAO CAP
13 de set.
R$ 15,90
Cartão C6 Carbon Mastercard •••• 5573

JOUMAR ROSSINE DE ALME
13 de set.
R$ 42,00
Cartão C6 Carbon Mastercard •••• 5573

JOUMAR ROSSINE DE ALME
13 de set.
R$ 15,00
Cartão C6 Carbon Mastercard •••• 5573

JOUMAR
13 de set.
R$ 15,00
Cartão C6 Carbon Mastercard •••• 5573

Centro de Formação Continuada Secretaria Municipal de Educação Lucas do Rio Verde
13 de set.
R$ 50,00
Cartão C6 Carbon Mastercard •••• 5573

Supermercado Guará
11 de set.
R$ 79,61
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
11 de set.
R$ 60,93
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
11 de set.
R$ 22,35
Cartão C6 Carbon Mastercard •••• 5573

Padaria Ideal
11 de set.
R$ 15,37
Cartão C6 Carbon Mastercard •••• 5573

City of Antônio Carlos
6 de set.
R$ 11,00
Cartão C6 Carbon Mastercard •••• 5573

CHEGUE BAR
6 de set.
R$ 16,00
Cartão C6 Carbon Mastercard •••• 5573

CHEGUE BAR
6 de set.
R$ 16,00
Cartão C6 Carbon Mastercard •••• 5573

CHEGUE BAR
6 de set.
R$ 26,00
Cartão C6 Carbon Mastercard •••• 5573

Droga Raia
6 de set.
R$ 32,79
Cartão C6 Carbon Mastercard •••• 5573

CHRISTIANLOAN
5 de set.
R$ 126,80
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
5 de set.
R$ 54,24
Cartão C6 Carbon Mastercard •••• 5573

Supermercado Guará
4 de set.
R$ 70,52
Cartão C6 Carbon Mastercard •••• 5573

Padaria Ideal
4 de set.
R$ 18,71
Cartão C6 Carbon Mastercard •••• 5573

Supermercado Guará
30 de ago.
R$ 54,59
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
30 de ago.
R$ 51,17
Cartão C6 Carbon Mastercard •••• 5573

Banking Avenue Show
29 de ago.
R$ 34,00
Cartão C6 Carbon Mastercard •••• 5573

JOTACE COMERCIO DE CAR
29 de ago.
R$ 25,00
Cartão C6 Carbon Mastercard •••• 5573

CM INDUSTRIA DE PAES E
24 de ago.
R$ 64,99
Cartão C6 Carbon Mastercard •••• 5573

Sr. Brauhaus Cervejaria
24 de ago.
R$ 1.502,00
Cartão C6 Carbon Mastercard •••• 5573

Centerbox
23 de ago.
R$ 41,42
Cartão C6 Carbon Mastercard •••• 5573

Padaria Ideal
22 de ago.
R$ 13,02
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
21 de ago.
R$ 89,34
Cartão C6 Carbon Mastercard •••• 5573

SILVEIRA'S BARBER SHOP
20 de ago.
R$ 12,99
Cartão C6 Carbon Mastercard •••• 5573

Posto Aliança II
16 de ago.
R$ 14,25
Cartão C6 Carbon Mastercard •••• 5573

POSTO SAO DOMINGOS GAV
16 de ago.
R$ 8,99
Cartão C6 Carbon Mastercard •••• 5573

FUZUÊ BAR
15 de ago.
R$ 76,00
Cartão C6 Carbon Mastercard •••• 5573

VANI FRITURAS
14 de ago.
R$ 45,00
Cartão C6 Carbon Mastercard •••• 5573

JAIRO PESCADA BOX 28
14 de ago.
R$ 30,00
Cartão C6 Carbon Mastercard •••• 5573

Supermercado Guará
13 de ago.
R$ 2,78
Cartão C6 Carbon Mastercard •••• 5573

Supermercado Guará
13 de ago.
R$ 91,26
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
13 de ago.
R$ 93,87
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
13 de ago.
R$ 93,86
Cartão C6 Carbon Mastercard •••• 5573

Budega dos Pinhões
11 de ago.
R$ 84,00
Cartão C6 Carbon Mastercard •••• 5573

MERCADINHO ABREU BRAG
10 de ago.
R$ 12,00
Cartão C6 Carbon Mastercard •••• 5573

Mercadinho da Praia
10 de ago.
R$ 19,97
Cartão C6 Carbon Mastercard •••• 5573

Churrascaria Picuí
10 de ago.
R$ 36,80
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
10 de ago.
R$ 6,99
Cartão C6 Carbon Mastercard •••• 5573

DOMINGUINHO
8 de ago.
R$ 18,00
Cartão C6 Carbon Mastercard •••• 5573

DOMINGUINHO
8 de ago.
R$ 18,00
Cartão C6 Carbon Mastercard •••• 5573

DOMINGUINHO
8 de ago.
R$ 65,00
Cartão C6 Carbon Mastercard •••• 5573

DOMINGUINHO
8 de ago.
R$ 36,00
Cartão C6 Carbon Mastercard •••• 5573

Internet Group
8 de ago.
R$ 13,00
Cartão C6 Carbon Mastercard •••• 5573

Pronto Mercado
8 de ago.
R$ 9,99
Cartão C6 Carbon Mastercard •••• 5573

IFOOD.COM
7 de ago.
R$ 21,17
Cartão C6 Carbon Mastercard •••• 5573

Supermercado Guará
6 de ago.
R$ 68,17
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
6 de ago.
R$ 72,88
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
6 de ago.
R$ 72,87
Cartão C6 Carbon Mastercard •••• 5573

IFOOD.COM
6 de ago.
R$ 20,42
Cartão C6 Carbon Mastercard •••• 5573

PADARIA IDEAL ABOLICA
6 de ago.
R$ 27,84
Cartão C6 Carbon Mastercard •••• 5573

IFOOD.COM
5 de ago.
R$ 35,89
Cartão C6 Carbon Mastercard •••• 5573

Cobasi
3 de ago.
R$ 7,84
Cartão C6 Carbon Mastercard •••• 5573

CRIOLO
2 de ago.
R$ 36,00
Cartão C6 Carbon Mastercard •••• 5573

CRIOLO
2 de ago.
R$ 44,00
Cartão C6 Carbon Mastercard •••• 5573

Pronto Mercado
2 de ago.
R$ 9,99
Cartão C6 Carbon Mastercard •••• 5573

Mercadão São Luiz | Loja Rui Barbosa
30 de jul.
R$ 175,26
Cartão C6 Carbon Mastercard •••• 5573

CENTRO DE FORMACAO CAP
27 de jul.
R$ 15,90
Cartão C6 Carbon Mastercard •••• 5573

55880697 BRENDHA FORTE
27 de jul.
R$ 10,00
Cartão C6 Carbon Mastercard •••• 5573

Pronto Mercado
26 de jul.
R$ 15,46
Cartão C6 Carbon Mastercard •••• 5573

SEMPRE VIVA
25 de jul.
R$ 39,97
Cartão C6 Carbon Mastercard •••• 5573

TORTELE ALIMENTOS LTDA
25 de jul.
R$ 21,95
C6 Checking •••• 900

Supermercado Guará
24 de jul.
R$ 56,32
Cartão C6 Carbon Mastercard •••• 5573

Mercadão São Luiz | Loja Rui Barbosa
24 de jul.
R$ 220,06
Cartão C6 Carbon Mastercard •••• 5573

Padaria Ideal
23 de jul.
R$ 16,95
Cartão C6 Carbon Mastercard •••• 5573

Cobasi
22 de jul.
R$ 33,79
Cartão C6 Carbon Mastercard •••• 5573

Mundo Verde Meireles
22 de jul.
R$ 25,04
Cartão C6 Carbon Mastercard •••• 5573

FRANCISCA OLIVEIRA
18 de jul.
R$ 69,50
Cartão C6 Carbon Mastercard •••• 5573

G R RIBEIRO
17 de jul.
R$ 86,02
Cartão C6 Carbon Mastercard •••• 5573

Mercadão São Luiz | Loja Rui Barbosa
17 de jul.
R$ 132,08
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
17 de jul.
R$ 132,08
Cartão C6 Carbon Mastercard •••• 5573

Agropet
17 de jul.
R$ 40,00
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
17 de jul.
R$ 132,08
Cartão C6 Carbon Mastercard •••• 5573

Padaria Ideal
17 de jul.
R$ 33,04
Cartão C6 Carbon Mastercard •••• 5573

IFOOD.COM
16 de jul.
R$ 23,89
Cartão C6 Carbon Mastercard •••• 5573

JOAOALBERTO
15 de jul.
R$ 46,00
Cartão C6 Carbon Mastercard •••• 5573

Centerbox
12 de jul.
R$ 53,47
Cartão C6 Carbon Mastercard •••• 5573

Centerbox
12 de jul.
R$ 53,47
Cartão C6 Carbon Mastercard •••• 5573

Supermercado Guará
9 de jul.
R$ 85,28
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
6 de jul.
R$ 27,00
Cartão C6 Carbon Mastercard •••• 5573

Pronto Mercado
5 de jul.
R$ 19,98
Cartão C6 Carbon Mastercard •••• 5573

SEMPRE VIVA
5 de jul.
R$ 39,48
Cartão C6 Carbon Mastercard •••• 5573

Mercadão São Luiz | Loja Rui Barbosa
5 de jul.
R$ 235,72
Cartão C6 Carbon Mastercard •••• 5573

IFOOD.COM
3 de jul.
R$ 41,96
Cartão C6 Carbon Mastercard •••• 5573

DELICIA DE FATIMA 3
30 de jun.
R$ 78,50
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
29 de jun.
R$ 40,38
Cartão C6 Carbon Mastercard •••• 5573

Centerbox
25 de jun.
R$ 56,15
Cartão C6 Carbon Mastercard •••• 5573

Mercadão São Luiz | Loja Rui Barbosa
25 de jun.
R$ 290,86
Cartão C6 Carbon Mastercard •••• 5573

STAR POSTO
24 de jun.
R$ 44,81
Cartão C6 Carbon Mastercard •••• 5573

Mercadinhos São Luiz
22 de jun.
R$ 40,78
Cartão C6 Carbon Mastercard •••• 5573

Pronto Mercado
21 de jun.
R$ 13,49
Cartão C6 Carbon Mastercard •••• 5573

Paula confeitaria artesanal fortaleza
19 de jun.
R$ 18,00
Cartão C6 Carbon Mastercard •••• 5573

Mercadão São Luiz | Loja Rui Barbosa
18 de jun.
R$ 62,36
Cartão C6 Carbon Mastercard •••• 5573

Mercadão São Luiz | Loja Rui Barbosa
18 de jun.
R$ 130,54
Cartão C6 Carbon Mastercard •••• 5573

IFOOD.COM
17 de jun.
R$ 42,96
Cartão C6 Carbon Mastercard •••• 5573

COMERCIAL
17 de jun.
R$ 12,99
Cartão C6 Carbon Mastercard •••• 5573

ROCHELY MARIA DA SILVA
29 de mar.
R$ 15,00
BCO C6 S.A. •••• 900

Newton Sampaio Cirino Filho
17 de jan.
R$ 5,00
C6 Checking •••• 900

Loterias CAIXA
17 de jan.
R$ 47,57
C6 Checking •••• 900

MARLUY KILDARY FERNANDES XAVIER
8 de jan.
R$ 3,00
C6 Checking •••• 900

Antonio Airton Nano de Carvalho Filho
14 de dez. de 2024
R$ 5,00
C6 Checking •••• 900
`

  const rawTransactions = parseC6BankText(sampleData)
  return convertC6ToTransactions(rawTransactions)
}

import { parseWeekCode } from './sheets'

// Real employee names from the actual payroll export.
// "Last, First" format (used by McGuire's, Crabs, Flounder's, Embassy, Breakers, Pegleg).
const LAST_FIRST = [
  'Alexander, Gavin', 'Arevalo Gomez, Julissa Roxana', 'Baggoo, Daneille', 'Bailey, Brandon',
  'Bailey, Teka', 'Bailey, Trudy-Ann', 'Baltazar, Alberta', 'Bartolo Angel, Esperanza',
  'Bartolo, Fulgencio', 'Bartolo, Gabriel', 'Bartolo, Lucio', 'Bartolopastor, Alejo',
  'Batista, Argenis', 'Bautista, Reymundo', 'Bello Rodriguez, Benny', 'Bennett, Davan y d',
  'Bennett, Sonia', 'Binns, Natasha', 'Blackwood, Lisa', 'Blackwood, Rashawn', 'Blake, Dwight',
  'Bolanos, Mauricio', 'Brooks, Aldith', 'Brown, Paul', 'Brown, Sheldon', 'Bryan, Ajani',
  'Bryan, Rochelle', 'Campbell, Geoffry', 'Campbell, Phillip', 'Campbell, Terrence',
  'Carty, Weston', 'Castellanos, Jorge', 'Castro Bello, Veronica', 'Castro, Ruben',
  'Charles, Samson', 'Chicas Araujo, Francisco', 'Christopher, Damion', 'Clarke, Beverly',
  'Cornwall, Orette', 'Dacres, Kehlia', 'Dacres, Marvisha', 'De La Cruz, Deymi',
  'Duncan, Andy', 'Dunstan, Javan', 'Edwards, Shyale', 'Escalona, Edgardo',
  'Farquharson, Sherica', 'Faizullin, Begzhan', 'Flores-De La Cruz, Efren', 'Forrester, Beshan',
  'France, Omar', 'Francis, Malique', 'Franton, Derrano', 'Frazer, Shavel', 'Galindo, Brayan',
  'Garcia Bartolo, Edgar', 'Garcia Ladino, Giovanny', 'Garcia Maximo, Juarez',
  'Gaspar Ramirez, Jose Alejandro', 'Gillett, Tevoy', 'Goncalves, Laercio', 'Gonzales, Esteban',
  'Gonzales, Pedro', 'Gonzalez, Sterling', 'Gooden, Trishelle', 'Graham, Taric',
  'Grant, Dalton', 'Grindley, Denisha', 'Grizzle, Rackeem', 'Guerrero, Bryan', 'Guevara, Angel',
  'Harris, Tashi', 'Hawkins, Kamar', 'Hedgin, Andrew', 'Henry, Dennis', 'Hernandez, Florencio',
  'Hernandez, Genaro', 'Hernandez, Guillermo', 'Hernandez, Noel', 'Hernandez Nava, Fernando',
  'Herrera, Julissa', 'Hudson, Janeth', 'Huitzilac Bolanos, Sofio', 'Huitzilac-Hernandez, Andrea',
  'Hutzilac Hernandez, Alejandro', 'Irving, Britany', 'Jacoba, Cruz', 'James, Shemekia',
  'Jackson, Jovaughn', 'Jackson, Shanika', 'Jenkins, Kalle', 'Jimenez Carballo, Pablo',
  'Jimenez, Irving', 'Johnson, Aaron', 'Johnson, Richard', 'Kentish, Monique',
  'Kettle-Dixon, Heather', 'King, Marlene', 'Labrada Barzaga, Yuris Eidy', 'Landell, Danoi',
  'Lawrence, Q-Wayne', 'Leachman, Jasiann', 'Lewis, Alton', 'Lewis, Rajean', 'Lindsay, Roshaun',
  'Liriano, Noel', 'Lynch, Rayon', 'Maldonado Fernandez, Jennifer', 'Marsh, Daniel',
  'Mckain, Sadiki', 'Mclaren, Jermain', 'Mclaughlin, Darion', 'Mcleod, Christina',
  'Mcleod, Romario', 'Montero, Maria', 'Morley, Jazmine', 'Morris, De\u0027Wayne', 'Morse, Cammal',
  'Mosquera, Diego', 'Myers, Shamora', 'Nasif, Yalile', 'Nembhard, Naseef', 'Nesbitt, Sherayne',
  'Nevers, Waqar', 'Niyazov, Yerzhan', 'Oliver Edwin, Flores', 'Palache, Grace Ann',
  'Palmer, Sanya', 'Perez, Jose', 'Petru, Marek', 'Phillips, Oraine', 'Picton, Chevard',
  'Plummer, Damian', 'Prieto Chavez, Mauricio', 'Reid, Asanthae', 'Reynolds, Shaelan',
  'Ricketts, Georgia', 'Riley, Rasheeda', 'Rivera, Maria', 'Rodriguez-Bello, Refugio',
  'Saka, Christiano', 'Saley, Juan', 'Salvador, Daniel', 'Sanchez, Edwin', 'Sanchez, Jorge',
  'Savage, Kedesha', 'Savage, Kelsey', 'Sawyers, Kerisha', 'Scarlett, Tyrese',
  'Shaw, Jordon', 'Simpson, Kymani', 'Simpson, Rasheen', 'Smith, Fabian', 'Smith, Garfield',
  'Smith, Romeo', 'Sommerville, Richard', 'Soriano Azcona, Adrian', 'Soriano, Diana',
  'Sorrell, Andrew', 'Spence, Chris', 'Spence, Everald', 'Spence, Peter', 'Sparks, Shevonie',
  'Starks, Tony', 'Stephenson, Antoneil', 'Stephenson, Kenneth', 'Stewart, Akeem',
  'Stone, Steve', 'Sutherland, Tori', 'Sylvestri, Bernice', 'Tai-Loy, Tyrique',
  'Torres, Sor', 'Trowers, Amos', 'Valtinov, Aleksandar', 'Vega, Axel', 'Vicente, Avelino',
  'Villa Diaz, Estefania', 'Wallace, Dwayna', 'Watson, Gevaughny', 'Weir, Makeyla',
  'West, Shane', 'Whyte, Timoy', 'Williams, Sasha-Gay', 'Wilson, Shanakay', 'Wright, Caroline',
  'Wright, Jovan', 'Wright, Shemar', 'Bellinfante, Ranesha'
]

// "First Last" format (used by GS Gelato, hotels, Pelican, VILLAGE INN, etc.).
const FIRST_LAST = [
  'Ackeme Brooks', 'Adlan Anderson', 'Aida Mirzabulat', 'Aja Anderson', 'Akeem Walters',
  'Akim Martin', 'Alberto Carrillo', 'Alejandra Montano silva', 'Alexander Marshall',
  'Alfonso Paniagua', 'Allen Irving', 'Althea Campbell', 'Ana Dominguez Hernandez',
  'Ana Laura Ramirez', 'Ana Laura Tamayo Ramirez', 'Anabella Contessi', 'Andrae Barrett',
  'Andrew Dixon', 'Angel Navarrate', 'Anna Marie Cirant', 'Annette Post', 'Anthony Mcceachron',
  'Araceli Lopez', 'Ariadne Romero Jarero', 'Ashley Wright', 'Balazs Kovacs', 'Bismark Campaz',
  'Brent Barronette', 'Carl Stott', 'Carlton Douglas', 'Carlos Romero', 'Carol Scott',
  'Catalina Perez Huziar', 'Cecilia Castillo', 'Cecilia Elizabeth Castillo Barajas',
  'Charli Edenfield', 'Cresula Territo', 'Cristal Ibarra Partida', 'Dale Bornett',
  'Dania Benitez', 'Davon Getton', 'Dean Shaw', 'Deandria Anderson', 'Demani Clarke',
  'Dikeledi Maeko', 'Donovan Harris', 'Dwayne Waysome', 'D\u0027Marc Weir', 'Easton Henry',
  'Eduardo Gonzalez-Trejo', 'Eduardo Xivir', 'Eric Diaz', 'Erika Duran Barco',
  'Esmeralda Ucelo Cisneros', 'Everet Graham', 'Fay Davis', 'Ferrera Nohemi',
  'Franco Jose Ruscica Lois', 'Gabor Molnar', 'Gabriela Chavarin Arreola', 'Georgina Csipkes',
  'Gladys Diana Mera Herrerra', 'Gladys Meza Herrera', 'Gloria Valencia',
  'Graciela Altamarino Hernandez', 'Gretchen Ortiz', 'Guadalupe Garcia Villanueva',
  'Guillermo Romero', 'Guillermo Romero Jarero', 'Guy Streeter', 'Gyula Nagy',
  'Hector Bautistas', 'Hugo Enrique Camacho', 'Imelda Bautista Lopez', 'Irani Daniela Ortiz Pena',
  'Irving Nunez Chavarin', 'Ismael Aguilar Vargas', 'Ismael Ramirez Muro', 'Jahbarrie Walker',
  'Jair Vargas Perez', 'Jamille Tyrell', 'Javaun Williams', 'Jesus Ismael Hernandez Medina',
  'Jodi-ann McKay', 'Johannes Raidman', 'Johnathan Corona', 'Jonathan Delgado Castillo',
  'Jorge Eric Perez', 'Josefina Sarabia Velasco', 'Juan Segoviano', 'Julian Crossman',
  'Julio Plaza', 'Kambria Pride', 'Karl Pakkas', 'Karla Flores Lopez', 'Kaydean Marshall',
  'Keith Gardne', 'Kening Li', 'Kerry ann Walker', 'Kimani Jones', 'Kimberly Williams',
  'Kristofer Almar Taru', 'Lakeisha Louise Williamson', 'Lashaun Pride', 'Laszlone Boglyasovszki',
  'Latiesha Talbert', 'Laureen Simberg', 'Liliana Ramirez Muro', 'Lissette Tituana',
  'Lorena Gurrola', 'Luis Gabriel Jimenez Roldan', 'Luis Roberto Flores Morales',
  'Luzely Sanchez', 'Margarita Hernandez Serrano', 'Maria Columba Navarro Perez',
  'Maria Dolores Lopez Sanchez', 'Maria Elena Muro Hernandez', 'Maria Georgina Matul',
  'Maria Jose Ramirez', 'Maria Navarro Perez', 'Maria Prekker', 'Maria Rivera', 'Martha Jimenez',
  'Melba Julieth Sanabria', 'Michael Cardenas', 'Michael Carter', 'Michael Osbourne',
  'Michell Avila Valero', 'Michel Palomares Paritda', 'Miguel Feliberti', 'Monica Tatis',
  'Nancy Aguilar Vargas', 'Nassima Shayakhmetova', 'Nelly Gonzalez', 'Nevvoy Lindsay',
  'Nicole Wright', 'Noel Alvarez', 'Noel Bailey', 'Noel Jeremy Alvarez',
  'Noemi Rodriguez Ibarra', 'Norbert Almasi', 'Norman Cole', 'Obdulia Ibarra Torres',
  'Odecia Pryce', 'Oshane Gayle', 'Paul Gayle', 'Paul Samuels', 'Pavaughn Hamilton',
  'Peiedad Hernandez Sanchez', 'Piedad Hernandez Sanchez', 'Raul Pulido', 'Renata Esparza',
  'Ricardo e.', 'Richard Gyimadu', 'Richard Robinson', 'Richard Sommerville', 'Rosa Delgado',
  'Roberto Contessi', 'Roelda Morris', 'Rozar Chung', 'Ruel Ellis', 'Rushane Regent',
  'Sean Mullings', 'Shaday Wiggan', 'Shakier Reid', 'Shaula Malcom', 'Shaundrice Foster',
  'Shena Thomas', 'Sherrian Samuels', 'Simone Samuels', 'Stacy Juarez Bautista',
  'Stephanie Lujan Perez', 'Stiward Hernandez', 'Tavis Russell', 'Tieanardo Campbell',
  'Tony Cultibert', 'Trevauni Cowell', 'Venese Edward', 'Venise Dwyer', 'Veronica Navarro Perez',
  'Vikramreddy Gottumukkula', 'Viridiana Aldaco', 'Vokia Rolle', 'Wayne McLeod', 'Wideline Georges',
  'Whitney Powell', 'Xavier Williams', 'Xochith Palomares Partida', 'Yadira Esparza',
  'Yasmin Valero', 'Yeimy Alvarado', 'Yerzhan Niyazov'
]

// Real departments and hourly rates, grouped by business type.
const RESTAURANT_DEPTS = [
  { name: 'Kitchen', rates: [17, 18, 19, 20, 21, 22, 25, 26] },
  { name: 'Hostess', rates: [16] },
  { name: 'Wait', rates: [7.63], tipped: true },
  { name: 'Food Runner', rates: [12.98, 13.98], tipped: true },
  { name: 'Busser', rates: [11.98, 12, 12.98], tipped: true },
  { name: 'Bartender', rates: [12.98, 13], tipped: true },
  { name: 'Server/Bartender', rates: [12], tipped: true },
  { name: 'Manager', rates: [27] },
  { name: 'Coordinator', rates: [18] },
  { name: 'Training', rates: [13, 17, 19] },
  { name: 'Side Work', rates: [14, 15] },
  { name: 'Silver', rates: [17] },
  { name: 'Janitor', rates: [17, 22] },
  { name: 'Glasswasher', rates: [18] },
  { name: 'Dishwasher', rates: [16, 17, 18, 19] },
  { name: 'Otis', rates: [16, 17] }
]

const GELATO_DEPTS = [
  { name: 'Boxing', rates: [15, 16, 17.8, 18, 19] },
  { name: 'Production-1', rates: [22] },
  { name: 'Production-2', rates: [21] },
  { name: 'Production-3', rates: [18, 23] },
  { name: 'Freezer', rates: [16, 17.8, 18] },
  { name: 'Pasteurization', rates: [16, 18] },
  { name: 'R&M', rates: [23.5] },
  { name: 'Inventory Control', rates: [18] }
]

const HOTEL_DEPTS = [
  { name: 'Housekeeping', rates: [16, 17, 18, 19] },
  { name: 'Housekeeping Manager', rates: [20] },
  { name: 'Front Desk', rates: [15, 17, 18] },
  { name: 'Front Desk Manager', rates: [19] },
  { name: 'Laundry', rates: [16, 17] },
  { name: 'Houseperson', rates: [17] },
  { name: 'Maintenance', rates: [16, 17, 18, 21] },
  { name: 'Breakfast/Laundry', rates: [16] },
  { name: 'Cook', rates: [17, 19, 23, 26] },
  { name: 'Head Cook', rates: [26] },
  { name: 'Server/Bartender', rates: [12], tipped: true }
]

const HOTEL_KEYWORDS = [
  'Hilton', 'Comfort Inn', 'Holiday Inn', 'Hampton', 'Seabreeze', 'Days Inn', 'Beal',
  'Village', 'Pelican', 'Home 2', 'HENDERSON', 'Island', 'Embassy', 'Terrace', 'Breakers',
  'Tru', 'Candlewood', 'Wyndham', 'Gulf', 'Andy Ds'
]

// Companies that report names as "Last, First" in the export.
const LAST_FIRST_KEYWORDS = ['McGuire', 'Crabs', 'Flounder', 'Embassy', 'Breakers', 'Pegleg']

function seededRandom(seed) {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}

function round2(n) {
  return Math.round(n * 100) / 100
}

function fmtDate(d) {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

// A-year (2026) week 1 starts Monday Dec 22 2025, incrementing 7 days per week.
const BASE_A = new Date(2025, 11, 22)
const BASE_W = new Date(2024, 11, 23)

function payStartFor(type, week) {
  const base = type === 'A' ? BASE_A : BASE_W
  const d = new Date(base)
  d.setDate(d.getDate() + (week - 1) * 7)
  return d
}

function bizType(name) {
  if (name.includes('Gelato')) return 'gelato'
  if (HOTEL_KEYWORDS.some((k) => name.includes(k))) return 'hotel'
  return 'restaurant'
}

function useLastFirst(name) {
  return LAST_FIRST_KEYWORDS.some((k) => name.includes(k))
}

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)]
}

/**
 * Generate realistic mock payroll rows for a single week code (e.g. "a32").
 *
 * Row schema matches the real monitoring payroll export:
 * company, weekCode, invoice, payStart, payEnd, name, department, hours, rate,
 * subtotal, otHrs, otRate, otSubtotal, tips, deductions, total, totalCheck, fee
 *
 * @param {Array} companies - [{ name }]
 * @param {string} weekCode - e.g. "a32"
 * @returns {Array}
 */
export function generatePayrollForWeek(companies, weekCode) {
  const pc = parseWeekCode(weekCode)
  if (!pc) return []

  const rows = []

  companies.forEach((c, ci) => {
    const rand = seededRandom(5000 + ci * 977 + pc.week * 31)
    const type = bizType(c.name)
    const depts = type === 'gelato' ? GELATO_DEPTS : type === 'hotel' ? HOTEL_DEPTS : RESTAURANT_DEPTS

    const min = type === 'gelato' ? 25 : type === 'hotel' ? 5 : 12
    const max = type === 'gelato' ? 40 : type === 'hotel' ? 20 : 40
    const empCount = min + Math.floor(rand() * (max - min + 1))

    const invoice = type === 'gelato' || c.name.includes('Pelican') ? 0 : pc.type === 'A' ? pc.week + 51 : pc.week
    const payStart = payStartFor(pc.type, pc.week)
    const payEnd = new Date(payStart)
    const payEndStr = fmtDate(payEnd)
    const payStartStr = fmtDate(payStart)

    let fee
    if (c.name.includes('McGuire')) fee = 2
    else if (type === 'gelato') fee = rand() < 0.4 ? 3 : 2
    else fee = 0

    const lf = useLastFirst(c.name)
    const pool = lf ? LAST_FIRST : FIRST_LAST

    for (let e = 0; e < empCount; e++) {
      const dept = pick(rand, depts)
      const rate = pick(rand, dept.rates)
      const hours = round2(5 + rand() * 80)
      const subtotal = round2(hours * rate)

      let otHrs = 0
      let otRate = 0
      let otSubtotal = 0
      if (rand() < 0.12) {
        otHrs = round2(rand() * 18)
        otRate = round2(rate * 1.5)
        otSubtotal = round2(otHrs * otRate)
      }

      let tips = 0
      if (dept.tipped && rand() < 0.7) {
        tips = round2(dept.name === 'Wait' ? 40 + rand() * 1100 : 30 + rand() * 500)
      }

      let deductions = 0
      if (rand() < 0.15) {
        deductions = round2(rand() * 30)
      }

      const total = round2(subtotal + otSubtotal + tips - deductions)
      const totalCheck = round2(total * (c.name.includes('McGuire') ? 0.875 : 8 / 9))

      rows.push({
        company: c.name,
        weekCode,
        invoice,
        payStart: payStartStr,
        payEnd: payEndStr,
        name: pick(rand, pool),
        department: dept.name,
        hours,
        rate,
        subtotal,
        otHrs,
        otRate,
        otSubtotal,
        tips,
        deductions,
        total,
        totalCheck,
        fee
      })
    }
  })

  rows.sort((a, b) => {
    if (a.company !== b.company) return a.company.localeCompare(b.company)
    return a.name.localeCompare(b.name)
  })

  return rows
}

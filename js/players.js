/* =============================================================================
 *  players.js  —  DEFAULT (seed) player list used by the searchable "spiller"
 *  questions (Toppscorer, Gullhansken, Norges målscorer, …).
 *
 *  This is a STARTER list of well-known players per nation so the search works
 *  out of the box — it is NOT every squad member. Update it year to year from
 *  the Admin page (Oppsett → Spillere), where you can paste a full list. The
 *  live list lives in the database; this file only seeds / backs it up.
 *
 *  Team names MUST match the team names in config.js exactly.
 * ===========================================================================*/
(function () {
  const byTeam = {
    "Norge": ["Erling Braut Haaland", "Martin Ødegaard", "Alexander Sørloth", "Oscar Bobb", "Antonio Nusa", "Sander Berge", "Fredrik Aursnes", "Morten Thorsby", "Kristoffer Ajer", "Leo Østigård", "Ørjan Nyland", "Patrick Berg", "Aron Dønnum", "Julian Ryerson", "Jørgen Strand Larsen"],
    "Frankrike": ["Kylian Mbappé", "Antoine Griezmann", "Ousmane Dembélé", "Aurélien Tchouaméni", "Eduardo Camavinga", "William Saliba", "Dayot Upamecano", "Theo Hernández", "Mike Maignan", "Marcus Thuram", "Bradley Barcola", "Adrien Rabiot", "Randal Kolo Muani", "Jules Koundé", "Warren Zaïre-Emery"],
    "Brasil": ["Vinicius Junior", "Rodrygo", "Raphinha", "Neymar", "Casemiro", "Bruno Guimarães", "Marquinhos", "Éder Militão", "Alisson", "Endrick", "Gabriel Martinelli", "Lucas Paquetá", "Gabriel Jesus", "Éderson", "Danilo"],
    "Argentina": ["Lionel Messi", "Lautaro Martínez", "Julián Álvarez", "Ángel Di María", "Rodrigo De Paul", "Enzo Fernández", "Alexis Mac Allister", "Emiliano Martínez", "Cristian Romero", "Nicolás Otamendi", "Nahuel Molina", "Giovani Lo Celso"],
    "Portugal": ["Cristiano Ronaldo", "Bruno Fernandes", "Bernardo Silva", "Rafael Leão", "João Félix", "Diogo Jota", "Vitinha", "Rúben Dias", "Gonçalo Ramos", "Pedro Neto", "Nuno Mendes", "João Cancelo", "Rúben Neves", "Diogo Costa"],
    "Spania": ["Lamine Yamal", "Pedri", "Gavi", "Rodri", "Nico Williams", "Álvaro Morata", "Dani Olmo", "Ferran Torres", "Unai Simón", "Fabián Ruiz", "Mikel Oyarzabal", "Mikel Merino", "Marc Cucurella", "Robin Le Normand"],
    "England": ["Harry Kane", "Jude Bellingham", "Bukayo Saka", "Phil Foden", "Cole Palmer", "Declan Rice", "Marcus Rashford", "Jordan Pickford", "Trent Alexander-Arnold", "Jarrod Bowen", "Anthony Gordon", "John Stones", "Kyle Walker"],
    "Tyskland": ["Jamal Musiala", "Kai Havertz", "Florian Wirtz", "Joshua Kimmich", "Ilkay Gündogan", "Leroy Sané", "Niclas Füllkrug", "Antonio Rüdiger", "Manuel Neuer", "Serge Gnabry", "Robert Andrich", "Jonathan Tah", "Marc-André ter Stegen"],
    "Nederland": ["Memphis Depay", "Cody Gakpo", "Frenkie de Jong", "Virgil van Dijk", "Denzel Dumfries", "Xavi Simons", "Nathan Aké", "Tijjani Reijnders", "Donyell Malen", "Bart Verbruggen", "Jurriën Timber", "Wout Weghorst"],
    "Belgia": ["Kevin De Bruyne", "Romelu Lukaku", "Jérémy Doku", "Youri Tielemans", "Leandro Trossard", "Amadou Onana", "Loïs Openda", "Thibaut Courtois", "Charles De Ketelaere", "Timothy Castagne"],
    "Uruguay": ["Federico Valverde", "Darwin Núñez", "Ronald Araújo", "Rodrigo Bentancur", "Nicolás de la Cruz", "Facundo Pellistri", "Sergio Rochet", "Maximiliano Araújo", "Manuel Ugarte", "José María Giménez"],
    "Kroatia": ["Luka Modrić", "Mateo Kovačić", "Marcelo Brozović", "Joško Gvardiol", "Ivan Perišić", "Andrej Kramarić", "Dominik Livaković", "Mario Pašalić", "Josip Šutalo", "Luka Sučić"],
    "USA": ["Christian Pulisic", "Weston McKennie", "Tyler Adams", "Gio Reyna", "Yunus Musah", "Folarin Balogun", "Antonee Robinson", "Matt Turner", "Tim Weah", "Ricardo Pepi"],
    "Mexico": ["Hirving Lozano", "Santiago Giménez", "Edson Álvarez", "Raúl Jiménez", "Guillermo Ochoa", "Orbelín Pineda", "César Montes", "Luis Chávez", "Alexis Vega"],
    "Sør-Korea": ["Son Heung-Min", "Lee Kang-in", "Kim Min-jae", "Hwang Hee-chan", "Hwang In-beom", "Cho Gue-sung", "Lee Jae-sung", "Kim Jin-su"],
    "Japan": ["Kaoru Mitoma", "Takefusa Kubo", "Wataru Endo", "Ritsu Doan", "Daichi Kamada", "Ao Tanaka", "Takehiro Tomiyasu", "Junya Ito", "Hidemasa Morita"],
    "Marokko": ["Achraf Hakimi", "Hakim Ziyech", "Sofyan Amrabat", "Youssef En-Nesyri", "Brahim Díaz", "Noussair Mazraoui", "Azzedine Ounahi", "Yassine Bounou", "Bilal El Khannouss", "Eliesse Ben Seghir"],
    "Senegal": ["Sadio Mané", "Kalidou Koulibaly", "Édouard Mendy", "Ismaïla Sarr", "Nicolas Jackson", "Pape Matar Sarr", "Idrissa Gueye", "Habib Diallo", "Iliman Ndiaye"],
    "Egypt": ["Mohamed Salah", "Omar Marmoush", "Mostafa Mohamed", "Mohamed Elneny", "Trezeguet", "Mohamed Abdelmonem", "Mahmoud Hassan"],
    "Elfenbenskysten": ["Sébastien Haller", "Franck Kessié", "Nicolas Pépé", "Simon Adingra", "Wilfried Singo", "Evan Ndicka", "Seko Fofana", "Amad Diallo", "Yan Diomandé"],
    "Ghana": ["Mohammed Kudus", "Thomas Partey", "Iñaki Williams", "Jordan Ayew", "Antoine Semenyo", "Kamaldeen Sulemana", "Mohammed Salisu"],
    "Algerie": ["Riyad Mahrez", "Ismaël Bennacer", "Saïd Benrahma", "Houssem Aouar", "Ramy Bensebaini", "Amine Gouiri", "Youcef Atal"],
    "Tunisia": ["Hannibal Mejbri", "Youssef Msakni", "Aïssa Laïdouni", "Ellyes Skhiri", "Montassar Talbi", "Mohamed Dräger"],
    "Sør-Afrika": ["Percy Tau", "Themba Zwane", "Lyle Foster", "Ronwen Williams", "Teboho Mokoena", "Relebohile Mofokeng"],
    "Kapp Verde": ["Ryan Mendes", "Garry Rodrigues", "Jovane Cabral", "Bebé", "Kenny Rocha Santos", "Gilson Benchimol"],
    "DR Kongo": ["Yoane Wissa", "Cédric Bakambu", "Chancel Mbemba", "Théo Bongonda", "Silas Katompa", "Gaël Kakuta", "Arthur Masuaku"],
    "Sveits": ["Granit Xhaka", "Breel Embolo", "Manuel Akanji", "Xherdan Shaqiri", "Yann Sommer", "Dan Ndoye", "Ruben Vargas", "Fabian Rieder", "Zeki Amdouni"],
    "Canada": ["Alphonso Davies", "Jonathan David", "Cyle Larin", "Stephen Eustáquio", "Tajon Buchanan", "Ismaël Koné", "Jacob Shaffelburg"],
    "Qatar": ["Akram Afif", "Almoez Ali", "Hassan Al-Haydos", "Abdelkarim Hassan", "Meshaal Barsham"],
    "Bosnia-Hercegovina": ["Edin Džeko", "Miralem Pjanić", "Sead Kolašinac", "Ermedin Demirović", "Amar Dedić", "Benjamin Tahirović"],
    "Tsjekkia": ["Patrik Schick", "Tomáš Souček", "Adam Hložek", "Vladimír Coufal", "Antonín Barák", "Lukáš Provod", "Tomáš Holeš"],
    "Skottland": ["Andrew Robertson", "Scott McTominay", "John McGinn", "Billy Gilmour", "Che Adams", "Angus Gunn", "Ryan Christie", "Lewis Ferguson"],
    "Haiti": ["Frantzdy Pierrot", "Duckens Nazon", "Danley Jean Jacques", "Johnny Placide"],
    "Tyrkia": ["Hakan Çalhanoğlu", "Arda Güler", "Kenan Yıldız", "Kerem Aktürkoğlu", "Ferdi Kadıoğlu", "Merih Demiral", "Orkun Kökçü", "Barış Alper Yılmaz"],
    "Australia": ["Mathew Ryan", "Jackson Irvine", "Riley McGree", "Craig Goodwin", "Harry Souttar", "Connor Metcalfe", "Martin Boyle"],
    "Paraguay": ["Miguel Almirón", "Julio Enciso", "Antonio Sanabria", "Gustavo Gómez", "Diego Gómez", "Omar Alderete"],
    "Ecuador": ["Moisés Caicedo", "Enner Valencia", "Pervis Estupiñán", "Piero Hincapié", "Kendry Páez", "Gonzalo Plata", "Ángelo Preciado"],
    "Sverige": ["Viktor Gyökeres", "Alexander Isak", "Dejan Kulusevski", "Emil Forsberg", "Anthony Elanga", "Lucas Bergvall", "Gabriel Gudmundsson"],
    "Saudi-Arabia": ["Salem Al-Dawsari", "Firas Al-Buraikan", "Mohammed Kanno", "Salman Al-Faraj", "Saud Abdulhamid", "Nawaf Al-Aqidi"],
    "Iran": ["Mehdi Taremi", "Sardar Azmoun", "Alireza Jahanbakhsh", "Alireza Beiranvand", "Mehdi Ghayedi", "Saeid Ezatolahi"],
    "New Zealand": ["Chris Wood", "Marko Stamenić", "Liberato Cacace", "Matthew Garbett", "Ben Old"],
    "Østerrike": ["David Alaba", "Marcel Sabitzer", "Konrad Laimer", "Christoph Baumgartner", "Marko Arnautović", "Patrick Wimmer", "Nicolas Seiwald"],
    "Irak": ["Aymen Hussein", "Ali Jasim", "Zidane Iqbal", "Ibrahim Bayesh", "Jalal Hassan"],
    "Usbekistan": ["Eldor Shomurodov", "Abbosbek Fayzullaev", "Khusayin Norchaev", "Otabek Shukurov", "Jaloliddin Masharipov"],
    "Colombia": ["James Rodríguez", "Luis Díaz", "Jhon Durán", "Rafael Santos Borré", "Dávinson Sánchez", "Jefferson Lerma", "Richard Ríos", "Daniel Muñoz"],
    "Panama": ["Adalberto Carrasquilla", "José Fajardo", "Michael Murillo", "Aníbal Godoy", "César Blackman", "Ismael Díaz"],
    "Jordan": ["Mousa Al-Tamari", "Yazan Al-Naimat", "Nizar Al-Rashdan", "Ali Olwan", "Yazan Al-Arab"],
    "Curaçao": ["Leandro Bacuna", "Juninho Bacuna", "Tahith Chong", "Gervane Kastaneer", "Cuco Martina", "Sontje Hansen"]
  };

  const list = [];
  Object.keys(byTeam).forEach((team) => byTeam[team].forEach((name) => list.push({ name, team })));
  window.DEFAULT_PLAYERS = list;
})();

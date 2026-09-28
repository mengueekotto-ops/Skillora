/**
 * Skillora AI Technical Assessment Engine
 * - 15 domain-specific Multiple Choice Questions (MCQ) per profession
 * - 30-second countdown timer per question
 * - Auto-restart to Question 1 if 30s timer expires
 * - 70% pass threshold (>= 11/15) for Verified Account creation
 */

const DOMAIN_QUESTION_BANKS = {
    electrician: [
        {
            q: "Avant d'intervenir sur une armoire électrique résidentielle ou industrielle, quelle est la PREMIÈRE action obligatoire ?",
            options: [
                "Porter des gants en cuir standard",
                "Couper le disjoncteur général, consigner (LOTO) et vérifier l'absence de tension (VAT)",
                "Remplacer immédiatement tous les fusibles par des disjoncteurs",
                "Brancher un ampèremètre en série"
            ],
            correct: 1,
            explanation: "La consignation électrique (LOTO) et la Vérification d'Absence de Tension (VAT) avec un VAT normalisé sont la règle absolue de sécurité."
        },
        {
            q: "Quel est le rôle principal d'un disjoncteur différentiel haute sensibilité (30 mA) ?",
            options: [
                "Protéger les appareils contre les surtensions atmosphériques",
                "Protéger les personnes contre les contacts indirects et départs d'incendie par fuite de courant",
                "Mesurer la consommation électrique en kWh",
                "Réguler la tension du réseau électrique"
            ],
            correct: 1,
            explanation: "Le disjoncteur différentiel 30 mA coupe le circuit dès qu'une fuite à la terre supérieure à 30 mA est détectée, protégeant la vie humaine."
        },
        {
            q: "Quelle section de câble en cuivre (en mm²) est requise pour alimenter une cuisinière électrique monophasée protégée par un disjoncteur 32A ?",
            options: ["1.5 mm²", "2.5 mm²", "4.0 mm²", "6.0 mm²"],
            correct: 3,
            explanation: "Selon la norme NF C 15-100, un circuit 32A monophasé exige des conducteurs en cuivre d'au moins 6 mm²."
        },
        {
            q: "Dans un tableau électrique triphasé 400V équilibré, quelle est la tension mesurée entre une phase et le neutre ?",
            options: ["400 V", "230 V", "110 V", "0 V"],
            correct: 1,
            explanation: "En réseau triphasé basse tension classique, la tension simple (Phase-Neutre) est de 230V et la tension composée (Phase-Phase) est de 400V."
        },
        {
            q: "Quel instrument de mesure doit être utilisé pour mesurer la résistance de terre d'un piquet de terre ?",
            options: ["Un multimètre classique en mode Ohmmètre", "Un telluromètre / testeur de terre", "Un oscilloscope numérique", "Un wattmètre"],
            correct: 1,
            explanation: "La résistance de la prise de terre se mesure avec un telluromètre par méthode des 3 piquets (méthode 62%)."
        },
        {
            q: "Quelle est la valeur maximale recommandée pour la résistance de la prise de terre en installation résidentielle (selon NF C 15-100) ?",
            options: ["100 Ohms", "500 Ohms", "1000 Ohms", "0.1 Ohm"],
            correct: 0,
            explanation: "La valeur maximale de la prise de terre est de 100 Ohms pour garantir le fonctionnement du différentiel 500mA."
        },
        {
            q: "Quelle est la couleur normalisée obligatoire pour le conducteur de Neutre ?",
            options: ["Rouge", "Vert et Jaune", "Bleu clair", "Noir"],
            correct: 2,
            explanation: "Le conducteur neutre doit impérativement être repéré par la couleur bleu clair (la terre étant vert/jaune)."
        },
        {
            q: "Pour une ligne d'éclairage protégée par un disjoncteur 10A ou 16A, quelle est la section minimale de câble ?",
            options: ["0.75 mm²", "1.5 mm²", "2.5 mm²", "4 mm²"],
            correct: 1,
            explanation: "Pour les circuits d'éclairage, la section minimale requise est de 1.5 mm²."
        },
        {
            q: "Quel est le rôle d'un parafoudre (SPD) installé en tête d'installation dans les zones à fort niveau kéraunique ?",
            options: [
                "Empêcher les pannes de courant de longue durée",
                "Écouler les surtensions transitoires d'origine atmosphérique vers la terre",
                "Stabiliser la fréquence du réseau à 50 Hz",
                "Augmenter l'intensité du courant délivré"
            ],
            correct: 1,
            explanation: "Le parafoudre protège les équipements électroniques sensibles contre les pics de surtension dus à la foudre."
        },
        {
            q: "Sur un onduleur solaire hybride, que signifie le paramètre MPPT (Maximum Power Point Tracking) ?",
            options: [
                "Un système de coupure manuelle en cas d'incendie",
                "Un algorithme qui optimise en permanence le point de puissance maximale des panneaux",
                "Un dispositif de stockage d'énergie thermique",
                "Une jauge de niveau d'acide des batteries"
            ],
            correct: 1,
            explanation: "Le MPPT ajuste la tension et le courant d'entrée pour extraire la puissance maximale fournie par les panneaux solaires."
        },
        {
            q: "Comment tester la continuité d'un circuit hors tension avec un multimètre ?",
            options: [
                "En position Voltmètre AC 750V",
                "En position Bip/Continuité (symbole diode/ondes sonores)",
                "En mode Ampèremètre DC 10A",
                "En branchant le multimètre sur la batterie 12V"
            ],
            correct: 1,
            explanation: "Le testeur de continuité émet un bip sonore si le circuit est fermé (résistance très faible, proche de 0 Ohm)."
        },
        {
            q: "Pourquoi ne doit-on JAMAIS utiliser un fil de cuivre pour shunter un disjoncteur ou fusible défectueux ?",
            options: [
                "Car cela diminue la luminosité des ampoules",
                "Car cela supprime la protection contre les surcharges et court-circuits, risquant un incendie fatal",
                "Car le cuivre est un isolant",
                "Car cela inverse la polarité du courant"
            ],
            correct: 1,
            explanation: "Shunter une protection expose les conducteurs à un échauffement destructeur et un départ de feu certain."
        },
        {
            q: "Quelle est la distance de sécurité minimale (Volume 1) autour d'une baignoire ou douche pour l'installation de prises 230V standard ?",
            options: ["Prises autorisées directement au-dessus", "Interdites dans les volumes 0 et 1 (distance min. 2.25m / volume 2)", "50 cm de la pomme de douche", "10 cm"],
            correct: 1,
            explanation: "Les prises de courant 230V classiques sont strictement interdites dans les volumes 0, 1 et 2 d'une salle de bain."
        },
        {
            q: "Lors du raccordement de batteries pour système solaire en série (2x 12V 100Ah), quelle est la tension et capacité totale obtenue ?",
            options: ["12V - 200Ah", "24V - 100Ah", "24V - 200Ah", "12V - 100Ah"],
            correct: 1,
            explanation: "En série, les tensions s'additionnent (12V + 12V = 24V) et la capacité reste la même (100Ah)."
        },
        {
            q: "Quel équipement de protection individuelle (EPI) est indispensable pour vérifier une armoire sous tension en industrie ?",
            options: [
                "Casque avec visière anti-arc flash, gants isolants 1000V et tapis isolant",
                "Gants de jardinage et lunettes de soleil",
                "Chaussures ouvertes et montre métallique",
                "Masque anti-poussière simple"
            ],
            correct: 0,
            explanation: "Les gants isolants vérifiés, la visière anti-arc flash et les vêtements ininflammables protègent du flash électrique mortel."
        }
    ],

    plumber: [
        {
            q: "Quelle est la fonction essentielle d'un siphon (P-trap) sous un évier ou lavabo ?",
            options: [
                "Augmenter la pression de l'eau dans les canalisations",
                "Conserver une garde d'eau qui empêche les gaz d'égout nauséabonds et toxiques de remonter",
                "Filtrer le calcaire présent dans l'eau potable",
                "Ralentir le débit pour économiser l'eau"
            ],
            correct: 1,
            explanation: "La garde d'eau du siphon forme un bouchon étanche aux odeurs et gaz de fosse ou d'égout."
        },
        {
            q: "Sur un chauffe-eau électrique à accumulation (cumulus), à quelle pression s'ouvre généralement la soupape du groupe de sécurité ?",
            options: ["1 bar", "3 bars", "7 bars", "15 bars"],
            correct: 2,
            explanation: "Le groupe de sécurité s'ouvre à 7 bars pour évacuer l'excès de pression provoqué par la dilatation de l'eau chaude."
        },
        {
            q: "Quelle pente minimale d'évacuation par mètre est recommandée pour une évacuation d'eaux usées en PVC (diamètre 40 à 100 mm) ?",
            options: ["0.1 % (1 mm/m)", "1 à 2 % (1 à 2 cm/m)", "10 % (10 cm/m)", "50 %"],
            correct: 1,
            explanation: "Une pente de 1 à 2 cm par mètre assure un écoulement fluide et autonettoyant sans blocage des matières solides."
        },
        {
            q: "Lors du brasage fort (brasure cuivre-phosphore ou argent) sur tube cuivre, quel gaz est utilisé pour chauffer ?",
            options: ["Méthane pur", "Chalumeau Oxygène-Acétylène ou Propane haute température", "Azote liquide", "Air comprimé"],
            correct: 1,
            explanation: "Le chalumeau oxy-acétylénique ou propane spécifique permet d'atteindre les 650°C à 800°C nécessaires à la brasure forte."
        },
        {
            q: "Quel composant doit être installé si la pression d'eau du réseau de ville dépasse 4.5 bars ?",
            options: ["Un surpresseur d'eau", "Un réducteur de pression (détendeur)", "Un filtre à charbon", "Un clapet anti-retour simple"],
            correct: 1,
            explanation: "Le réducteur de pression protège la tuyauterie, la robinetterie et le chauffe-eau contre les coups de bélier et fuites."
        },
        {
            q: "Quel diamètre de tuyau PVC est standard pour l'évacuation des toilettes (WC) ?",
            options: ["32 mm", "40 mm", "50 mm", "100 mm"],
            correct: 3,
            explanation: "Le diamètre nominal standard pour l'évacuation d'un WC individuel est le PVC Ø 100 mm."
        },
        {
            q: "Quelle est la cause principale du phénomène de 'coup de bélier' dans une canalisation d'eau ?",
            options: [
                "Une température d'eau trop basse",
                "La fermeture brutale d'une vanne ou d'un robinet créant une onde de choc hydraulique",
                "Un tuyau trop large",
                "Une fuite continue au niveau du compteur"
            ],
            correct: 1,
            explanation: "La fermeture rapide d'un robinet (mitigeur, électrovanne) stoppe net le flux, créant une surpression brutale et un bruit de choc."
        },
        {
            q: "Quel matériau d'étanchéité fileté est le plus adapté pour les raccords d'eau potable filetés traditionnels ?",
            options: ["Colle PVC", "Filasse de lin avec pâte à joint (ou ruban PTFE/Téflon de qualité)", "Mastic silicone acide", "Scotch d'électricien"],
            correct: 1,
            explanation: "La filasse avec pâte à joint permet même de légers ajustements de serrage sans fuite, contrairement au ruban mal posé."
        },
        {
            q: "Qu'est-ce qu'un clapet anti-pollution (ou disconnecteur) sur l'arrivée d'eau générale ?",
            options: [
                "Un compteur d'eau volumétrique",
                "Un clapet anti-retour empêchant l'eau viciée d'un réseau privé de refluer dans le réseau public",
                "Un adoucisseur d'eau",
                "Un régulateur de débit pour jardin"
            ],
            correct: 1,
            explanation: "Le clapet anti-retour ou disconnecteur empêche toute pollution en retour du réseau d'eau potable public."
        },
        {
            q: "Dans un système PER (polyéthylène réticulé), quel raccord mécanique garantit la plus grande fiabilité indémontable sous chape ?",
            options: ["Raccord à visser sans joint", "Raccord à glissement ou à sertir", "Colle cyanoacrylate", "Soudure à l'étain"],
            correct: 1,
            explanation: "Les raccords à glissement et à sertir sur tube PER sont certifiés et autorisés pour les poses encastrées."
        },
        {
            q: "Avant de mettre en service une tuyauterie de plomberie neuve, quel test de pression est obligatoire ?",
            options: [
                "Test d'écoute à l'oreille",
                "Mise en épreuve sous pression d'eau (1.5 fois la pression de service, min 6-10 bars) avec manomètre",
                "Simple ouverture du robinet 5 secondes",
                "Test à la fumée"
            ],
            correct: 1,
            explanation: "Le test d'épreuve hydraulique avec pompe d'épreuve et manomètre vérifie l'absence absolue de micro-fuite pendant au moins 1 heure."
        },
        {
            q: "Pourquoi faut-il installer une ventilation primaire en toiture sur la colonne de chute des eaux usées ?",
            options: [
                "Pour chauffer les combles en hiver",
                "Pour égaliser les pressions et éviter le désiphonage (aspiration de l'eau des siphons)",
                "Pour éclairer la tuyauterie",
                "Pour augmenter le bruit d'évacuation"
            ],
            correct: 1,
            explanation: "La ventilation de chute amène de l'air pour empêcher la dépression causée par la chasse d'eau de vider les siphons voisins."
        },
        {
            q: "Quelle anode est installée dans un ballon d'eau chaude pour protéger la cuve émaillée contre la corrosion perforante ?",
            options: ["Anode en cuivre", "Anode sacrificielle en Magnésium (ou anode titane ACI)", "Anode en plomb", "Anode en plastique"],
            correct: 1,
            explanation: "L'anode en magnésium se corrode à la place de l'acier de la cuve, protégeant le chauffe-eau."
        },
        {
            q: "Pour déboucher une canalisation en PVC sans l'abîmer mécaniquement ou thermiquement, quelle est la meilleure méthode ?",
            options: [
                "Verser de l'acide sulfurique pur bouillant",
                "Utiliser un furet mécanique manuel ou hydrocurage haute pression adapté",
                "Frapper sur le tuyau avec une masse",
                "Chauffer le PVC au chalumeau"
            ],
            correct: 1,
            explanation: "Le furet mécanique ou l'hydrocurage débouche efficacement sans fondre le PVC ni fragiliser les joints."
        },
        {
            q: "Quel est le risque de raccorder directement un tuyau en acier galvanisé à un tuyau en cuivre sans raccord diélectrique ?",
            options: [
                "Une fuite de gaz",
                "La corrosion galvanique accélérée (pile bimétallique) détruisant l'acier",
                "Un blocage instantané de l'eau",
                "Une eau trop calcaire"
            ],
            correct: 1,
            explanation: "Le couple galvanique cuivre-acier provoque la dissolution rapide du métal le moins noble (l'acier galvanisé)."
        }
    ],

    carpenter: [
        {
            q: "Quel taux d'humidité moyen du bois massif est recommandé pour fabriquer des meubles d'intérieur ou portes intérieures ?",
            options: ["30 % à 45 %", "8 % à 12 %", "1 % à 3 %", "60 %"],
            correct: 1,
            explanation: "Le bois sec étuvé à 8-12% d'humidité évite les fentes, voilages et retraits une fois le meuble installé en intérieur climatisé ou chauffé."
        },
        {
            q: "Quel assemblage traditionnel en bois offre la plus haute résistance mécanique à la traction et au cisaillement ?",
            options: ["Clouage droit en bout", "Assemblage à Tenon et Mortaise (ou Queue d'aronde)", "Agrafe simple", "Collage sur chant sans renfort"],
            correct: 1,
            explanation: "Le tenon-mortaise et la queue d'aronde bloquent mécaniquement les pièces en transmettant les efforts de façon optimale."
        },
        {
            q: "Sur une scie circulaire sur table, quel élément de sécurité est OBLIGATOIRE pour empêcher le rejet violent de la pièce de bois (kickback) ?",
            options: ["La manivelle de hauteur", "Le couteau diviseur monté derrière la lame", "Le capot d'aspiration des copeaux seul", "Une cale en carton"],
            correct: 1,
            explanation: "Le couteau diviseur maintient le trait de scie ouvert et empêche le bois de se refermer sur la lame en rotation."
        },
        {
            q: "Quelle colle à bois est classée D4 (résistance maximale à l'eau et aux intempéries extérieures) ?",
            options: ["Colle blanche vinylique D2 classique", "Colle Polyuréthane (PU) ou colle Époxy marine", "Colle thermofusible pour pistolet", "Colle à base d'amidon"],
            correct: 1,
            explanation: "Les colles D4 (polyuréthane liquide ou époxy bi-composant) résistent à l'immersion et aux expositions extérieures extrêmes."
        },
        {
            q: "Que signifie le sens du 'fil du bois' et pourquoi est-il crucial lors du rabotage manuel ou mécanique ?",
            options: [
                "C'est la couleur de la sève",
                "C'est l'orientation longitudinale des fibres de bois ; raboter dans le fil évite l'arrachement des fibres",
                "C'est la largeur des cernes d'aubier",
                "C'est le traitement insecticide appliqué"
            ],
            correct: 1,
            explanation: "Raboter dans le sens du fil produit une surface lisse et nette, alors qu'à contre-fil le bois s'arrache et fait des éclats."
        },
        {
            q: "Quelle essence de bois tropical africain est réputée pour son imputrescibilité naturelle en menuiserie extérieure et platelage ?",
            options: ["Balsa", "Iroko / Padouk / Teck", "Peuplier blanc", "Pin maritime non traité"],
            correct: 1,
            explanation: "L'Iroko, le Padouk et le Teck sont naturellement de classe d'emploi 4 (très durables face aux champignons et termites)."
        },
        {
            q: "Quel outil utilise-t-on pour tracer une ligne rigoureusement parallèle au chant d'une planche ?",
            options: ["Une fausse équerre", "Un trusquin", "Un niveau à bulle", "Un compas d'épaisseur"],
            correct: 1,
            explanation: "Le trusquin de menuisier possède une pointe traceuse guidée par une butée réglable contre le chant."
        },
        {
            q: "Comment compense-t-on le jeu de dilatation d'un parquet en bois massif posé au sol ?",
            options: [
                "En le collant fermement contre les murs",
                "En laissant un joint périphérique de dilatation de 8 à 15 mm le long de tous les murs (masqué par les plinthes)",
                "En le mouillant avant la pose",
                "En enfonçant des vis diagonales dans les murs"
            ],
            correct: 1,
            explanation: "Le joint périphérique permet au bois de gonfler en saison humide sans gondoler au centre de la pièce."
        },
        {
            q: "Quelle mèche à bois est spécifiquement conçue pour percer des trous borgnes à fond plat (ex: pose de charnières invisibles 35 mm) ?",
            options: ["Foret hélicoïdal à métaux", "Mèche Forstner", "Mèche à béton SDS", "Scie cloche à métaux"],
            correct: 1,
            explanation: "La mèche Forstner découpe un trou cylindrique net à fond parfaitement plat pour loger les boîtiers de charnières."
        },
        {
            q: "Quel est le rôle de la ponceuse et du ponçage progressif (du grain 80 vers 240) avant vernissage ?",
            options: [
                "Amincir la planche de 1 cm",
                "Éliminer les rayures de coupe, ouvrir les pores et créer un état de surface lisse sans traces",
                "Chauffer le bois pour le durcir",
                "Tester la dureté de l'écorce"
            ],
            correct: 1,
            explanation: "Le ponçage étagé élimine successivement les micro-rayures du grain précédent pour un fini impeccable."
        },
        {
            q: "Quel angle d'affûtage standard donne le meilleur compromis tranchant/durabilité sur un ciseau à bois classique ?",
            options: ["10 degrés", "25 à 30 degrés", "60 degrés", "90 degrés"],
            correct: 1,
            explanation: "Un biseau d'affûtage à 25° avec un micro-biseau à 30° assure un tranchant rasoir et résistant aux chocs au maillet."
        },
        {
            q: "Dans la réalisation d'une porte de placard en cadre et panneau (massif), pourquoi le panneau central ne doit-il JAMAIS être collé dans la rainure ?",
            options: [
                "Pour faire des économies de colle",
                "Pour lui permettre de se dilater et se rétracter librement sans fendre le cadre sous les variations d'hygrométrie",
                "Pour pouvoir le démonter tous les jours",
                "Pour qu'il vibre avec la musique"
            ],
            correct: 1,
            explanation: "Le panneau flottant dans sa rainure absorbe les variations dimensionnelles sans fissurer le cadre assemblé."
        },
        {
            q: "Quel équipement de protection individuelle est indispensable lors du sciage de MDF ou de bois traités ?",
            options: [
                "Masque respiratoire filtrant P2/P3 ou FFP2/FFP3 contre les poussières fines de résines et bois durs",
                "Foulard en soie simple",
                "Casquette de baseball",
                "Gants en laine amples près de la lame"
            ],
            correct: 0,
            explanation: "Les poussières de bois et formaldéhydes de MDF sont cancérigènes et exigent une protection respiratoire certifiée P3."
        },
        {
            q: "Pour visser une vis à bois près de l'extrémité d'une lame de bois dur sans la faire éclater, que faut-il faire ?",
            options: [
                "Visser à pleine vitesse avec une visseuse à choc",
                "Percer un avant-trou d'un diamètre légèrement inférieur au corps de la vis et fraiser l'emplacement de la tête",
                "Huiler la vis uniquement",
                "Frapper la vis au marteau avant de visser"
            ],
            correct: 1,
            explanation: "L'avant-trou évacue la matière et élimine les contraintes radiales d'éclatement sur le bois dur."
        },
        {
            q: "Sur une défonceuse portative, dans quel sens doit-on avancer la machine par rapport au sens de rotation de la fraise ?",
            options: [
                "En avalant (dans le même sens de rotation que la fraise)",
                "En opposition (en poussant contre le sens de rotation de la fraise pour garder le contrôle)",
                "Peu importe la direction",
                "En marche arrière les yeux fermés"
            ],
            correct: 1,
            explanation: "L'usinage en opposition empêche la machine d'être happée brutalement le long de la pièce de bois."
        }
    ],

    hvac: [
        {
            q: "Avant de charger un circuit frigorifique avec du fluide frigorigène (R410A / R32), à quel niveau de vide doit-on descendre avec la pompe à vide ?",
            options: ["Pas de vide requis", "Inférieur à 500 microns (ou 0.67 mbar) avec test de maintien du vide", "500 millibars", "2 bars relatifs"],
            correct: 1,
            explanation: "Un tirage au vide sous 500 microns élimine l'air incondensable et vaporise l'humidité destructrice d'huile frigorifique."
        },
        {
            q: "Pour tester l'étanchéité d'un circuit frigorifique sous pression avant mise en fluide, quel gaz neutre est impératif ?",
            options: ["Oxygène pur sous 50 bars", "Azote sec (N2) déshydraté avec manodétendeur", "Air comprimé d'atelier", "Gaz butane"],
            correct: 1,
            explanation: "L'azote sec est inerte, exempt d'humidité et ne présente aucun risque d'explosion au contact des huiles."
        },
        {
            q: "Quel est le rôle du détendeur thermostatique (ou capillaire) dans une climatisation ?",
            options: [
                "Comprimer les vapeurs de fluide",
                "Provoquer une brusque chute de pression du liquide chaud pour le faire entrer en évaporation à basse température",
                "Chauffer l'air de la pièce",
                "Mesurer le débit électrique"
            ],
            correct: 1,
            explanation: "Le détendeur abaisse la pression du liquide HP en liquide/vapeur BP très froide prête à absorber la chaleur dans l'évaporateur."
        },
        {
            q: "Si un compresseur de climatiseur split grogne (bruit de ronronnement) mais refuse de démarrer au condensateur, que faut-il tester en premier ?",
            options: [
                "Changer la télécommande",
                "Tester la capacité en microfarads (µF) du condensateur permanent de démarrage au capacimètre",
                "Vidanger tout le fluide dans l'atmosphère",
                "Changer le filtre à air"
            ],
            correct: 1,
            explanation: "Un condensateur de démarrage HS ou décalibré ne fournit plus le déphasage nécessaire au démarrage du moteur monophasé."
        },
        {
            q: "En climatisation, qu'est-ce que le calcul de la 'Surchauffe' (Superheat) à la sortie de l'évaporateur permet de vérifier ?",
            options: [
                "Que le liquide n'arrive pas au compresseur (protection contre les coups de liquide)",
                "Que la pièce est chauffée à 40°C",
                "Que le câble électrique est trop chaud",
                "La couleur des tuyaux"
            ],
            correct: 0,
            explanation: "Une surchauffe correcte (ex: 5K à 8K) garantit que 100% du fluide entrant au compresseur est à l'état de vapeur."
        },
        {
            q: "Quel est le danger mortel d'utiliser de l'Oxygène pour mettre sous pression un circuit contenant de l'huile de compresseur ?",
            options: [
                "Une odeur désagréable",
                "Une explosion thermo-chimique violente et immédiate (effet diesel auto-inflammation)",
                "Le gel des tuyaux",
                "Une baisse de tension"
            ],
            correct: 1,
            explanation: "L'oxygène pur sous pression s'auto-enflamme violemment au contact de l'huile de synthèse (POE/minérale), causant une explosion mortelle."
        },
        {
            q: "Quel outil certifié doit être utilisé pour récupérer du fluide frigorigène polluant lors d'un démontage ou d'une réparation ?",
            options: [
                "Un sac poubelle en plastique",
                "Une station de récupération homologuée avec bouteille de transfert spécifique et balance de pesée",
                "Une perceuse pour percer le tube",
                "Un seau d'eau"
            ],
            correct: 1,
            explanation: "La récupération du gaz dans une bouteille dédiée évite le rejet de gaz à effet de serre et respecte la réglementation F-Gas."
        },
        {
            q: "Quelle est la principale différence de sécurité entre le fluide R410A (A1) et le fluide nouvelle génération R32 (A2L) ?",
            options: [
                "Le R32 est un gaz inerte sans pression",
                "Le R32 est classé A2L (faiblement inflammable), exigeant des raccords dudgeon étanches et des locaux ventilés",
                "Le R32 ne fonctionne qu'avec de l'eau",
                "Le R410A est explosif à l'air libre"
            ],
            correct: 1,
            explanation: "Le fluide R32 a un GWP plus bas mais est légèrement inflammable (A2L) et nécessite un outillage compatible sans étincelles."
        },
        {
            q: "Quelle opération permet de nettoyer et désinfecter la batterie évaporateur d'un split mural encrassé de moisissures ?",
            options: [
                "Pulvériser de la peinture blanche",
                "Application d'un nettoyant dégraissant bactéricide/fongicide homologué puis rinçage à basse pression",
                "Gratter avec une brosse métallique dure sur les ailettes en aluminium",
                "Allumer une bougie sous l'appareil"
            ],
            correct: 1,
            explanation: "Le produit désinfectant pour clim élimine les biofilms bactériens et légionelles sans plier les ailettes délicates."
        },
        {
            q: "Que provoque un manque important de fluide frigorigène (fuite lente) sur l'unité intérieure d'un climatiseur ?",
            options: [
                "La formation de givre/glace sur les premiers tubes de l'évaporateur et un mauvais refroidissement",
                "Une surchauffe de la télécommande",
                "Une augmentation automatique de la puissance",
                "Une accélération anormale du ventilateur"
            ],
            correct: 0,
            explanation: "La chute de pression d'évaporation fait chuter la température sous 0°C, créant du givre visible sur la batterie."
        },
        {
            q: "Comment réalise-t-on un 'dudgeon' (collet battu conique à 45°) parfait sur un tube en cuivre frigorifique ?",
            options: [
                "En écrasant le cuivre avec une pince universelle",
                "En ébavurant soigneusement le tube, puis en utilisant une dudgeonnière excentrique calibrée avec une goutte d'huile POE",
                "En le chauffant jusqu'à fusion",
                "En le coupant à la scie à métaux sans ébavurer"
            ],
            correct: 1,
            explanation: "L'ébavurage et la dudgeonnière excentrique créent une portée conique lisse sans bavure garantissant l'étanchéité sous 40 bars."
        },
        {
            q: "Quel est le rôle du piège à huile (siphon d'huile) sur une liaison frigorifique verticale ascendante ?",
            options: [
                "Filtrer l'air ambiant",
                "Faciliter le retour de l'huile entraînée par le fluide vers le carter du compresseur",
                "Empêcher les bruits de vent",
                "Augmenter la vitesse du ventilateur"
            ],
            correct: 1,
            explanation: "Le siphon évite que l'huile ne reste piégée en bas de colonne, ce qui priverait le compresseur de lubrification."
        },
        {
            q: "Quel contrôle électrique permet de vérifier qu'un compresseur n'est pas 'à la masse' (en court-circuit avec la carcasse) ?",
            options: [
                "Mesure de l'isolement électrique avec un mégohmmètre sous 500V DC entre chaque borne et la terre (doit être > 5 MOhms)",
                "Test au tournevis testeur lumineux",
                "Mesure du diamètre des fils",
                "Test visuel de la peinture"
            ],
            correct: 0,
            explanation: "Le testeur d'isolement (mégohmmètre) détecte les amorçages de vernis d'enroulement vers la carcasse métallique."
        },
        {
            q: "À quoi sert la pompe de relevage de condensats sur une unité intérieure de climatisation ?",
            options: [
                "À pulvériser de l'eau sur les clients",
                "À évacuer l'eau de condensation produite par l'évaporateur lorsqu'une évacuation par gravité naturelle est impossible",
                "À injecter du réfrigérant",
                "À nettoyer le compresseur"
            ],
            correct: 1,
            explanation: "La pompe de relevage évite les débordements de bac à condensats lorsque l'écoulement n'a pas de pente naturelle."
        },
        {
            q: "Pourquoi le compresseur inverter (VFD) est-il beaucoup plus économe en électricité qu'un compresseur tout-ou-rien (On/Off) ?",
            options: [
                "Il ne s'allume jamais",
                "Il module sa vitesse de rotation en continu pour adapter exactement sa puissance thermique au besoin réel sans cycles de démarrages énergivores",
                "Il utilise des piles 9V",
                "Il fonctionne sans gaz"
            ],
            correct: 1,
            explanation: "La technologie Inverter évite les pics d'intensité au démarrage et fonctionne à charge partielle à son rendement optimal."
        }
    ],

    masonry: [
        {
            q: "Quel est le dosage volumétrique standard en ciment / sable / gravier pour fabriquer un béton armé structural dosé à 350 kg/m³ (règle du 1-2-3) ?",
            options: [
                "1 volume de ciment, 2 volumes de sable sec, 3 volumes de gravier + 0.5 volume d'eau propre",
                "1 volume de ciment pour 10 volumes de terre",
                "5 volumes de ciment pour 1 volume de sable sans gravier",
                "Du sable pur avec de l'eau salée"
            ],
            correct: 0,
            explanation: "La règle classique '1-2-3' (1 sac de ciment, 2 brouettes de sable, 3 brouettes de gravillon) donne un béton armé C25/30 très résistant."
        },
        {
            q: "Combien de jours minimum sont nécessaires pour qu'un béton coulé atteigne environ 70% à 80% de sa résistance caractéristique de calcul ?",
            options: ["6 heures", "24 heures", "7 jours (et 28 jours pour 100% de résistance normative)", "1 an"],
            correct: 2,
            explanation: "La cinétique de prise du ciment Portland atteint la majorité de sa résistance à 7 jours et sa valeur normalisée à 28 jours."
        },
        {
            q: "Pourquoi est-il indispensable de 'curer' le béton (l'arroser d'eau ou appliquer un produit de cure) pendant les premiers jours sous climat chaud ?",
            options: [
                "Pour refroidir la planète",
                "Pour empêcher l'évaporation prématurée de l'eau de gâchage, ce qui provoquerait des fissurations par retrait et une perte de résistance",
                "Pour laver la poussière de surface",
                "Pour changer la couleur du béton en vert"
            ],
            correct: 1,
            explanation: "L'hydratation du ciment nécessite de l'eau en permanence. Le dessèchement rapide génère des fissures et affaiblit le béton."
        },
        {
            q: "Quel est le rôle des armatures en acier (ferraillage) intégrées dans une poutre en béton armé soumise à la flexion ?",
            options: [
                "Rendre la poutre plus lourde",
                "Reprendre les efforts de traction (où le béton est fragile) tandis que le béton reprend les efforts de compression",
                "Conduire l'électricité dans le bâtiment",
                "Faciliter la peinture"
            ],
            correct: 1,
            explanation: "Le béton résiste très bien à la compression mais très mal à la traction. Les fers à béton en partie basse reprennent la traction."
        },
        {
            q: "Quel test de chantier simple permet de mesurer la plasticité et la maniabilité d'un béton frais avant coulage ?",
            options: [
                "Le test au thermomètre",
                "L'essai d'affaissement au cône d'Abrams (Slump Test)",
                "La pesée au pèse-personne",
                "Le test de flottaison"
            ],
            correct: 1,
            explanation: "Le cône d'Abrams mesure l'affaissement du béton en centimètres pour vérifier qu'il n'est ni trop sec ni trop mouillé."
        },
        {
            q: "Quel est le risque majeur d'ajouter un excès d'eau dans une bétonnière pour rendre le béton plus liquide et facile à tirer ?",
            options: [
                "Une augmentation de la dureté",
                "Une chute drastique de la résistance mécanique finale et un fort risque de ségrégation des granulats et fissuration",
                "Une odeur de chlore",
                "Une prise instantanée"
            ],
            correct: 1,
            explanation: "Tout excès d'eau crée des micro-vides après évaporation, divisant par deux la résistance du béton armé."
        },
        {
            q: "Quelle épaisseur minimale d'enrobage de béton (distance entre l'acier et l'extérieur) est exigée pour protéger les fers contre la corrosion ?",
            options: ["1 millimètre", "3 à 5 cm (selon exposition extérieure/intempéries) avec cales à béton", "15 cm obligatoires partout", "Pas d'enrobage nécessaire"],
            correct: 1,
            explanation: "Des cales d'enrobage garantissent 3 à 5 cm de béton protecteur étanche empêchant la rouille d'éclater le béton."
        },
        {
            q: "Lors du montage d'un mur en parpaings (agglos), comment s'assure-t-on de la solidité des angles et des liaisons ?",
            options: [
                "En empilant les parpaings sans croiser les joints verticaux",
                "En croisant impérativement les joints verticaux d'au moins 1/3 de parpaing et en créant des chaînages verticaux armés aux angles",
                "En utilisant du plâtre liquide",
                "En collant avec du scotch"
            ],
            correct: 1,
            explanation: "Le harpage croisé et les raidisseurs verticaux en béton armé lient les murs et évitent les fissures de tassement."
        },
        {
            q: "Quel outil de maçon est utilisé pour vérifier à la fois l'horizontalité et la verticalité d'un mur en cours de montage ?",
            options: ["Le niveau à bulle (ou niveau laser) et le fil à plomb", "Une éponge de carreleur", "Une pince multiprise", "Un pied à coulisse"],
            correct: 0,
            explanation: "Le niveau à bulle long (ou laser) et le fil à plomb garantissent un aplomb rigoureux à chaque rang de maçonnerie."
        },
        {
            q: "Qu'est-ce qu'une semelle filante en fondation superficielle ?",
            options: [
                "Une chaussure de sécurité",
                "Une poutre de béton armé continue coulée en fond de fouille hors gel pour répartir la charge des murs porteurs sur le sol",
                "Une tuile de toiture",
                "Un joint de carrelage"
            ],
            correct: 1,
            explanation: "La semelle filante élargit l'assise du bâtiment pour ne pas dépasser la capacité portante admissible du sol."
        },
        {
            q: "Pourquoi vibre-t-on le béton avec une aiguille vibrante lors du coulage des poteaux et poutres ?",
            options: [
                "Pour faire de la musique",
                "Pour chasser les bulles d'air emprisonnées, compacter le béton et éviter les 'nids de graviers' autour des armatures",
                "Pour accélérer la prise thermique",
                "Pour diluer le sable"
            ],
            correct: 1,
            explanation: "La vibration fluidifie temporairement le béton, l'amenant à enrober parfaitement toutes les barres d'acier sans porosité."
        },
        {
            q: "Lors de la pose de carrelage au sol, quel est le rôle du double encollage pour les carreaux de grand format (> 30x30 cm) ?",
            options: [
                "Consommer deux fois plus de colle pour la facture",
                "Garantir un transfert de colle à 100% sans vide sous le carreau, évitant la casse lors d'un choc lourd",
                "Rendre le carrelage brillant",
                "Empêcher les carreaux de glisser"
            ],
            correct: 1,
            explanation: "Le double encollage (au sol et au dos du carreau) élimine les poches d'air qui causent la casse sous le poinçonnement."
        },
        {
            q: "Quel type de ciment est le plus adapté pour des ouvrages en contact avec des eaux agressives ou en milieu marin ?",
            options: ["Plâtre fin", "Ciment PM-ES (Prise Mer - Eaux Sulfatées / Haut Fourneau)", "Chaux aérienne pure", "Ciment prompt décoratif"],
            correct: 1,
            explanation: "Les ciments PM-ES résistent à l'attaque chimique des sulfates et sels marins qui désagrègent les ciments standard."
        },
        {
            q: "Quel est le rôle d'un linteau au-dessus d'une ouverture de porte ou fenêtre ?",
            options: [
                "Décorer la façade",
                "Reporter les charges supérieures de la maçonnerie de part et d'autre des montants de l'ouverture",
                "Aérer la pièce",
                "Fixer la poignée de porte"
            ],
            correct: 1,
            explanation: "Le linteau en béton armé supporte le poids du mur supérieur et le transmet aux trumeaux latéraux."
        },
        {
            q: "Comment réalise-t-on une arase étanche en pied de mur avant élévation pour stopper les remontées capillaires d'eau du sol ?",
            options: [
                "En posant une couche de carton ondulé",
                "En coulant une chape de mortier hydrofuge riche avec bande d'étanchéité bitumineuse ou polyéthylène",
                "En peignant le sol à la gouache",
                "En laissant un trou béant"
            ],
            correct: 1,
            explanation: "La coupure de capillarité étanche bloque la montée de l'humidité du sol dans les murs habitables."
        }
    ],

    painter: [
        {
            q: "Quelle est l'étape préparatoire la plus importante avant d'appliquer une peinture de finition sur un mur neuf ?",
            options: [
                "Appliquer directement 3 couches épaisses sans nettoyer",
                "Égrener, dépoussiérer, reboucher les trous à l'enduit et appliquer une sous-couche (impression/primaire)",
                "Laver le mur à l'huile de vidange",
                "Coller du papier journal"
            ],
            correct: 1,
            explanation: "L'impression bloque les fonds absorbants, fixe les poussières et assure l'accroche uniforme de la peinture finale."
        },
        {
            q: "Pourquoi observe-t-on un phénomène de cloquage ou décollement de peinture quelques semaines après application ?",
            options: [
                "Le mur était trop froid",
                "Présence d'humidité emprisonnée dans le support ou absence de primaire sur fond farineux",
                "La peinture était trop chère",
                "Le pinceau était trop doux"
            ],
            correct: 1,
            explanation: "L'humidité résiduelle cherche à s'évaporer et pousse le film de peinture étanche, formant des cloques."
        },
        {
            q: "Quelle différence majeure existe-t-il entre une peinture acrylique (à l'eau) et une peinture glycéro (à l'huile/solvant) ?",
            options: [
                "L'acrylique sèche par évaporation de l'eau avec peu d'odeur/COV, la glycéro utilise des solvants minéraux et nettoie au White Spirit",
                "L'acrylique ne sèche jamais",
                "La glycéro se dilue à l'eau minérale",
                "Il n'y a aucune différence"
            ],
            correct: 0,
            explanation: "Les peintures acryliques sont nettoyables à l'eau et sèchent vite, les solvantées exigent du solvant et ont un tendu différent."
        },
        {
            q: "Quel manchon de rouleau doit-on choisir pour peindre un mur d'intérieur lisse avec une peinture velours ou satinée sans faire de 'peau d'orange' ?",
            options: ["Un rouleau à poils longs de 20 mm pour façade", "Un rouleau microfibre ou polyamide à poils courts (9 à 12 mm)", "Un rouleau en paille", "Une brosse métallique"],
            correct: 1,
            explanation: "Les poils ras (9-12 mm) en microfibre déposent la bonne épaisseur sans créer de texture granuleuse grossière."
        },
        {
            q: "Comment applique-t-on la peinture au plafond pour éviter les traces de reprises de rouleau à la lumière rasante ?",
            options: [
                "En peignant en rond n'importe comment",
                "En croisant les passes (en passes carrées) et en terminant le lissage dans le sens de la source de lumière principale sans s'arrêter",
                "En diluant avec 80% d'eau",
                "En allumant des projecteurs chauffants"
            ],
            correct: 1,
            explanation: "Travailler par zones de 1 m², lisser vers la fenêtre 'frais dans frais' évite toute démarcation visible au séchage."
        },
        {
            q: "Quel type d'enduit applique-t-on pour combler de profondes fissures ou trous dans un mur en maçonnerie ?",
            options: ["Enduit de lissage ultra-fin (0.5 mm)", "Enduit de rebouchage (ou mortier de réparation fibré) puis enduit de finition", "Peinture pure en pâte", "Dentifrice"],
            correct: 1,
            explanation: "L'enduit de rebouchage ne se rétracte pas en forte épaisseur, contrairement à l'enduit de lissage réservé au surfaçage."
        },
        {
            q: "Que signifie la finition 'Satinée' par rapport à une finition 'Mate' pour une peinture murale ?",
            options: [
                "La peinture satinée réfléchit modérément la lumière, est plus lessivable et résiste mieux aux pièces humides",
                "Le satin est toujours noir",
                "Le mat ne se nettoie jamais et ne peut pas être peint",
                "Le satin est réservé aux métaux extérieurs"
            ],
            correct: 0,
            explanation: "Le satin offre un film résistant et lessivable parfait pour couloirs et cuisines, le mat masque mieux les imperfections des plafonds."
        },
        {
            q: "Quel traitement antirouille préalable est impératif avant de peindre un portail en fer forgé extérieur ?",
            options: [
                "Brosser la calamine et rouille non adhérente, dégraisser et appliquer un primaire anticorrosion au phosphate de zinc",
                "Peindre directement sur la rouille humide",
                "Mouiller avec de l'eau salée",
                "Recouvrir de vernis à ongles"
            ],
            correct: 0,
            explanation: "Sans élimination de la rouille libre et application d'un primaire passivant, l'oxydation continue sous le film de peinture."
        },
        {
            q: "Pourquoi doit-on retirer le ruban de masquage adhésif (scotch peintre) avant que la peinture ne soit totalement sèche ?",
            options: [
                "Pour réutiliser le scotch",
                "Pour éviter que le film de peinture séché ne se déchire et n'écaille la bordure lors du retrait du ruban",
                "Pour que le mur sèche plus vite",
                "Parce que le scotch est toxique"
            ],
            correct: 1,
            explanation: "Retirer le ruban pendant que la peinture est encore amoureuse (semi-fraîche) assure une ligne de démarcation ultra-nette."
        },
        {
            q: "Quelle température ambiante et taux d'humidité sont déconseillés pour réaliser des travaux de peinture extérieure ?",
            options: [
                "20°C et 50% d'humidité",
                "En plein soleil au-dessus de 35°C (séchage trop rapide) ou par pluie/humidité > 80% et température < 5°C",
                "18°C à l'ombre",
                "22°C par temps calme"
            ],
            correct: 1,
            explanation: "Le grand froid empêche la coalescence du film et la forte chaleur le fait craqueler avant qu'il ne se tende."
        },
        {
            q: "Pour peindre sur un meuble en bois vernis ancien, quelle préparation est obligatoire ?",
            options: [
                "Égrenage complet au papier abrasif (grain 120-180) pour dépolir le vernis, dépoussiérage et primaire d'accroche",
                "Peinture directe sans ponçage",
                "Passage au chalumeau jusqu'à noircir le bois",
                "Laver à grande eau bouillante sans sécher"
            ],
            correct: 0,
            explanation: "Créer une micro-rugosité mécanique par égrenage permet au primaire d'ancrer ses molécules sans s'écailler."
        },
        {
            q: "À quoi sert un pistolet à peinture Airless (haute pression sans air) sur les grands chantiers ?",
            options: [
                "À nettoyer le sol",
                "À pulvériser rapidement de gros volumes de peinture avec un haut pouvoir couvrant et un rendement horaire élevé",
                "À aspirer la peinture des pots",
                "À percer les murs"
            ],
            correct: 1,
            explanation: "L'Airless atomise la peinture sous 150-200 bars sans brouillard d'air, idéal pour peindre de grandes surfaces en un temps record."
        },
        {
            q: "Quel équipement de protection individuelle est obligatoire lors de l'application de vernis solvanté au pistolet ?",
            options: [
                "Masque à cartouche filtrante anti-gaz et vapeurs organiques (type A2P3), lunettes étanches et combinaison",
                "Masque en tissu chirurgical simple",
                "Lunettes de vue sans masque",
                "Un ventilateur pointé sur soi"
            ],
            correct: 0,
            explanation: "Les solvants et isocyanates pénètrent les alvéoles pulmonaires. Seules les cartouches chimiques A2 protègent efficacement."
        },
        {
            q: "Comment élimine-t-on des traces d'humidité et taches de suie/nicotine tenaces sur un mur avant remise en peinture ?",
            options: [
                "En peignant avec de la peinture à l'eau très diluée",
                "En appliquant une sous-couche isolante anti-taches glycéro ou cationique bloque-fond",
                "En frottant avec du beurre",
                "En masquant avec du scotch"
            ],
            correct: 1,
            explanation: "Une peinture à l'eau ferait remonter les tanins et la suie. Le primaire isolant bloque chimiquement les taches dans le fond."
        },
        {
            q: "Pourquoi ne faut-il jamais jeter les restes de solvants et fonds de pots de peinture dans les éviers ou égouts ?",
            options: [
                "Parce que les tuyaux changent de couleur",
                "Parce que ce sont des déchets chimiques dangereux qui polluent gravement les nappes phréatiques et rivières (dépôt en déchetterie obligatoire)",
                "Pour garder les pots comme souvenirs",
                "Parce que la peinture durcit l'eau de pluie"
            ],
            correct: 1,
            explanation: "Les solvants et pigments lourds polluent des millions de litres d'eau potable. Ils doivent être recyclés en filière spécialisée."
        }
    ]
};

// Aliases
DOMAIN_QUESTION_BANKS["solar"] = DOMAIN_QUESTION_BANKS["electrician"];
DOMAIN_QUESTION_BANKS["hvac & refrigeration"] = DOMAIN_QUESTION_BANKS["hvac"];
DOMAIN_QUESTION_BANKS["auto mechanic"] = DOMAIN_QUESTION_BANKS["electrician"];
DOMAIN_QUESTION_BANKS["masonry / construction"] = DOMAIN_QUESTION_BANKS["masonry"];
DOMAIN_QUESTION_BANKS["painter & decorator"] = DOMAIN_QUESTION_BANKS["painter"];
DOMAIN_QUESTION_BANKS["tailor / textile"] = DOMAIN_QUESTION_BANKS["carpenter"];

const OPENROUTER_CONFIG = {
    // Never put API keys in browser code. Leave empty: the built-in domain question banks are used.
    apiKey: '',
    model: 'google/gemini-2.0-flash-001'
};

/**
 * AI Assessment Controller with OpenRouter AI Integration
 */
class SkilloraAIAssessment {
    constructor() {
        this.questions = [];
        this.currentIndex = 0;
        this.userAnswers = [];
        this.timerSeconds = 30;
        this.timerInterval = null;
        this.isCompleted = false;
        this.selectedProfession = 'Electrician';
        this.artisanFormData = null;
        this.passThreshold = 0.70; // 70%
        this.aiSource = 'Domain Bank';
    }

    async startAssessment(professionKey, artisanData = null) {
        this.artisanFormData = artisanData;
        this.selectedProfession = professionKey || 'Electrician';
        this.currentIndex = 0;
        this.userAnswers = new Array(15).fill(null);
        this.isCompleted = false;
        this.aiSource = 'OpenRouter AI (Gemini 2.0)';

        this.renderAssessmentModal();
        this.showLoadingQuestions();

        // 1. Try to fetch 15 fresh live AI questions from OpenRouter
        try {
            const liveQuestions = await this.fetchQuestionsFromOpenRouter(this.selectedProfession);
            if (liveQuestions && liveQuestions.length >= 10) {
                this.questions = liveQuestions.slice(0, 15);
                this.aiSource = 'OpenRouter AI (Gemini 2.0 Live)';
            } else {
                throw new Error('Fallback to local bank');
            }
        } catch (err) {
            console.log('Using local domain bank:', err.message);
            this.aiSource = 'Banque Métier IA Certifiée';
            this.loadLocalDomainQuestions(this.selectedProfession);
        }

        const pill = document.getElementById('ai-source-badge');
        if (pill) pill.textContent = `⚡ ${this.aiSource}`;

        this.loadQuestion(0);
    }

    loadLocalDomainQuestions(professionKey) {
        const rawKey = (professionKey || 'Electrician').toLowerCase().trim();
        let pool = DOMAIN_QUESTION_BANKS[rawKey];
        if (!pool) {
            for (let k in DOMAIN_QUESTION_BANKS) {
                if (rawKey.includes(k) || k.includes(rawKey)) {
                    pool = DOMAIN_QUESTION_BANKS[k];
                    break;
                }
            }
        }
        if (!pool || pool.length < 15) {
            pool = DOMAIN_QUESTION_BANKS['electrician'];
        }
        this.questions = [...pool].sort(() => 0.5 - Math.random()).slice(0, 15);
    }

    async fetchQuestionsFromOpenRouter(profession) {
        // Try local backend proxy first
        try {
            const res = await fetch('api_ai.php?action=generate_questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profession, count: 15 })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.success && data.questions) {
                    return data.questions;
                }
            }
        } catch (e) {
            // ignore and try direct openrouter below
        }

        // Direct OpenRouter API call
        const prompt = `You are Skillora AI certifying skilled artisans in Cameroon.
Generate exactly 15 practical, safety-critical Multiple-Choice Questions (MCQ) in French for the profession: "${profession}".
Focus on: safety standards (LOTO, VAT, PPE), diagnostics, tool usage, sizing calculations, and troubleshooting.

Return ONLY a JSON object:
{
  "questions": [
    {
      "q": "Question text in French",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct": 1,
      "explanation": "Brief explanation"
    }
  ]
}`;

        if (!OPENROUTER_CONFIG.apiKey) {
            throw new Error('No AI key configured in the browser; using domain question bank');
        }

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_CONFIG.apiKey}`,
                'HTTP-Referer': window.location.origin || 'http://localhost:8000',
                'X-Title': 'Skillora Platform'
            },
            body: JSON.stringify({
                model: OPENROUTER_CONFIG.model,
                messages: [
                    { role: 'system', content: 'You are an expert technical assessor. Output ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3
            })
        });

        if (!response.ok) throw new Error(`OpenRouter HTTP ${response.status}`);
        const result = await response.json();
        const content = result.choices?.[0]?.message?.content || '';
        const cleaned = content.replace(/```json/gi, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        return parsed.questions;
    }

    showLoadingQuestions() {
        const container = document.getElementById('ai-question-container');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem 1rem;">
                    <div class="ai-dot" style="width: 24px; height: 24px; margin: 0 auto 1.5rem auto;"></div>
                    <h3 style="color: var(--primary-dark); font-size: 1.25rem; margin-bottom: 0.5rem;">
                        ⚡ Connexion à OpenRouter AI (Gemini)...
                    </h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem;">
                        Génération dynamique de 15 questions techniques sur mesure pour : <strong>${this.selectedProfession}</strong>
                    </p>
                </div>
            `;
        }
    }

    renderAssessmentModal() {
        let modal = document.getElementById('skillora-ai-assessment-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'skillora-ai-assessment-modal';
            modal.className = 'ai-assessment-backdrop';
            document.body.appendChild(modal);
        }

        modal.innerHTML = `
            <div class="ai-assessment-card">
                <!-- Header -->
                <div class="ai-assessment-header">
                    <div class="header-left">
                        <div class="ai-pulse-pill">
                            <span class="ai-dot"></span>
                            <span id="ai-source-badge">⚡ OPENROUTER AI (GEMINI 2.0)</span>
                        </div>
                        <h2 class="ai-assessment-title">Évaluation Technique : <span id="ai-profession-tag">${this.selectedProfession}</span></h2>
                        <p class="ai-assessment-desc">15 questions techniques à choix multiples (QCM). <strong>30s par question</strong>. Seuil de réussite : <strong>70% (11/15)</strong>.</p>
                    </div>
                    <button class="ai-close-btn" onclick="window.aiAssessment.closeModal()">✕</button>
                </div>

                <!-- Live Progress & Timer Row -->
                <div class="ai-assessment-meta-bar">
                    <div class="ai-progress-indicator">
                        <span>Question <strong id="ai-q-num">1</strong> / 15</span>
                        <div class="ai-bar-track">
                            <div id="ai-bar-fill" class="ai-bar-fill" style="width: 6.66%;"></div>
                        </div>
                    </div>

                    <div class="ai-timer-badge" id="ai-timer-box">
                        <span class="timer-icon">⏱️</span>
                        <span class="timer-text">Temps restant : <strong id="ai-timer-val">30</strong>s</span>
                    </div>
                </div>

                <!-- Restart Alert Box (Initially hidden) -->
                <div id="ai-timeout-alert" class="ai-timeout-warning" style="display: none;">
                    ⚠️ <strong>Temps écoulé (30s dépassées) !</strong> Conformément au protocole de sécurité, l'évaluation a redémarré à la <strong>Question 1</strong>.
                </div>

                <!-- Question Area -->
                <div id="ai-question-container" class="ai-question-body">
                    <!-- Injected dynamically -->
                </div>

                <!-- Footer Navigation -->
                <div class="ai-assessment-footer" id="ai-footer-actions">
                    <button type="button" class="btn btn-outline" onclick="window.aiAssessment.closeModal()">Abandonner</button>
                    <button type="button" id="ai-btn-next" class="btn btn-primary" onclick="window.aiAssessment.handleNextClick()" disabled>
                        Valider la Réponse →
                    </button>
                </div>
            </div>
        `;
        modal.style.display = 'flex';
    }

    loadQuestion(index) {
        clearInterval(this.timerInterval);
        this.currentIndex = index;
        const qData = this.questions[index];
        if (!qData) return;

        // Update progress bar
        const qNum = document.getElementById('ai-q-num');
        const barFill = document.getElementById('ai-bar-fill');
        const metaBar = document.querySelector('.ai-assessment-meta-bar');
        if (metaBar) metaBar.style.display = 'flex';
        if (qNum) qNum.textContent = index + 1;
        if (barFill) barFill.style.width = `${((index + 1) / 15) * 100}%`;

        // Render question content
        const container = document.getElementById('ai-question-container');
        if (!container) return;

        container.innerHTML = `
            <div class="ai-question-box">
                <span class="ai-q-category">Section ${Math.floor(index / 3) + 1} • Sécurité, Diagnostic & Normes Métier</span>
                <h3 class="ai-q-text">${index + 1}. ${qData.q}</h3>
                
                <div class="ai-options-grid">
                    ${qData.options.map((opt, i) => `
                        <label class="ai-option-card" id="opt-label-${i}" onclick="window.aiAssessment.selectOption(${i})">
                            <input type="radio" name="ai_mcq_opt" value="${i}" style="display:none;">
                            <span class="opt-letter">${String.fromCharCode(65 + i)}</span>
                            <span class="opt-text">${opt}</span>
                            <span class="opt-check">✓</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        // Enable next button when selected
        const nextBtn = document.getElementById('ai-btn-next');
        if (nextBtn) {
            nextBtn.disabled = true;
            nextBtn.textContent = index === 14 ? 'Terminer & Obtenir mon Résultat IA 🚀' : 'Valider & Question Suivante →';
        }

        // Start 30s Countdown
        this.startTimer();
    }

    selectOption(index) {
        this.userAnswers[this.currentIndex] = index;
        document.querySelectorAll('.ai-option-card').forEach((el, i) => {
            el.classList.toggle('selected', i === index);
        });
        const nextBtn = document.getElementById('ai-btn-next');
        if (nextBtn) nextBtn.disabled = false;
    }

    startTimer() {
        this.timerSeconds = 30;
        const timerVal = document.getElementById('ai-timer-val');
        const timerBox = document.getElementById('ai-timer-box');
        
        if (timerVal) timerVal.textContent = this.timerSeconds;
        if (timerBox) {
            timerBox.classList.remove('warning', 'danger');
        }

        this.timerInterval = setInterval(() => {
            this.timerSeconds--;
            if (timerVal) timerVal.textContent = this.timerSeconds;

            if (this.timerSeconds <= 10 && this.timerSeconds > 5) {
                timerBox?.classList.add('warning');
            } else if (this.timerSeconds <= 5) {
                timerBox?.classList.add('danger');
            }

            // CRITICAL RULE: If 30 seconds pass on ANY question, restart all questions to Q1
            if (this.timerSeconds <= 0) {
                clearInterval(this.timerInterval);
                this.triggerTimerRestart();
            }
        }, 1000);
    }

    triggerTimerRestart() {
        const alertBox = document.getElementById('ai-timeout-alert');
        if (alertBox) {
            alertBox.style.display = 'block';
            setTimeout(() => {
                if (alertBox) alertBox.style.display = 'none';
            }, 6000);
        }

        const card = document.querySelector('.ai-assessment-card');
        card?.classList.add('shake-anim');
        setTimeout(() => card?.classList.remove('shake-anim'), 600);

        // Reset all progress and restart from Question 1
        this.userAnswers = new Array(15).fill(null);
        this.loadQuestion(0);
    }

    handleNextClick() {
        clearInterval(this.timerInterval);
        if (this.currentIndex < 14) {
            this.loadQuestion(this.currentIndex + 1);
        } else {
            this.evaluateFinalResult();
        }
    }

    evaluateFinalResult() {
        this.isCompleted = true;
        clearInterval(this.timerInterval);

        let correctCount = 0;
        this.questions.forEach((q, idx) => {
            if (this.userAnswers[idx] === q.correct) {
                correctCount++;
            }
        });

        const scorePercent = Math.round((correctCount / 15) * 100);
        const hasPassed = scorePercent >= 70; // 70% threshold

        const container = document.getElementById('ai-question-container');
        const metaBar = document.querySelector('.ai-assessment-meta-bar');
        const footer = document.getElementById('ai-footer-actions');
        if (metaBar) metaBar.style.display = 'none';

        if (hasPassed) {
            // SUCCESS - ACCOUNT CREATED WITH VERIFIED BADGE (✓)
            container.innerHTML = `
                <div class="ai-result-screen success">
                    <div class="result-badge-glow">🎉 🛡️</div>
                    <h2 class="result-title">Félicitations ! Évaluation Validée avec Succès</h2>
                    <p class="result-subtitle">Vous avez démontré une excellente maîtrise technique et des protocoles de sécurité.</p>

                    <div class="score-stat-box">
                        <div class="score-circle">
                            <span class="score-val">${scorePercent}%</span>
                            <span class="score-sub">${correctCount} / 15 Bonnes Réponses</span>
                        </div>
                        <div class="score-meta-list">
                            <div>• Seuil Requis : <strong>70% (11/15)</strong></div>
                            <div>• Statut du Profil : <strong style="color: #10b981;">✓ BADGE VÉRIFIÉ ATTRIBUÉ</strong></div>
                            <div>• Moteur IA Validateur : <strong style="color: var(--primary);">${this.aiSource}</strong></div>
                            <div>• Spécialité Certifiée : <strong>${this.selectedProfession}</strong></div>
                        </div>
                    </div>

                    <div class="ai-account-creation-card">
                        <h3>✨ Compte Artisan Vérifié Créé !</h3>
                        <p>Votre profil est désormais actif avec le Badge Vérifié (✓). Vous pouvez accepter des missions et recevoir vos paiements sous séquestre Mobile Money (FCFA).</p>
                    </div>
                </div>
            `;

            footer.innerHTML = `
                <button type="button" class="btn btn-primary btn-block" style="font-size: 1.1rem; padding: 1rem;" onclick="window.aiAssessment.confirmAccountCreated(${scorePercent})">
                    Accéder à mon Espace Pro Vérifié (✓) →
                </button>
            `;
        } else {
            // FAILED - UNDER 70%
            container.innerHTML = `
                <div class="ai-result-screen failure">
                    <div class="result-badge-glow">⚠️</div>
                    <h2 class="result-title">Score Insuffisant pour la Vérification</h2>
                    <p class="result-subtitle">Votre score est de <strong>${scorePercent}% (${correctCount}/15)</strong>. Le seuil de certification minimale est fixé à <strong>70% (11/15)</strong>.</p>

                    <div class="score-stat-box failure">
                        <div class="score-circle failure">
                            <span class="score-val">${scorePercent}%</span>
                            <span class="score-sub">${correctCount} / 15</span>
                        </div>
                        <div class="score-meta-list">
                            <div>• Réponses Correctes : <strong>${correctCount} / 15</strong></div>
                            <div>• Réponses Manquées : <strong style="color:#ef4444;">${15 - correctCount}</strong></div>
                            <div>• Règle de Sécurité : Réessayez le quiz pour maîtriser les normes.</div>
                        </div>
                    </div>

                    <div class="failed-tips-box">
                        <h4>💡 Conseils de Révision IA :</h4>
                        <p>Révisez les règles de sécurité (consignation, VAT, pressions maximales et sections de conducteurs) avant de retenter le test.</p>
                    </div>
                </div>
            `;

            footer.innerHTML = `
                <button type="button" class="btn btn-outline" onclick="window.aiAssessment.closeModal()">Fermer</button>
                <button type="button" class="btn btn-primary" onclick="window.aiAssessment.startAssessment('${this.selectedProfession}', window.aiAssessment.artisanFormData)">
                    🔄 Recommencer l'Évaluation (15 Questions)
                </button>
            `;
        }
    }

    confirmAccountCreated(score) {
        this.closeModal();
        alert(`🎉 Compte Artisan avec Badge VÉRIFIÉ (✓) créé avec succès !\nScore obtenu : ${score}%\nMoteur IA : ${this.aiSource}\nBienvenue sur Skillora.`);
        window.location.reload();
    }

    closeModal() {
        clearInterval(this.timerInterval);
        const modal = document.getElementById('skillora-ai-assessment-modal');
        if (modal) modal.style.display = 'none';
    }
}

// Global Singleton
window.aiAssessment = new SkilloraAIAssessment();

// Helper function to launch assessment directly from select field
function launchAIAssessmentForTrade(selectId) {
    const sel = document.getElementById(selectId);
    const prof = sel ? sel.value : 'Electrician';
    const nameInput = document.getElementById('artisan-name') || document.querySelector('input[placeholder*="Paul Plumbing"]') || document.querySelector('input[type="text"]');
    const name = nameInput ? nameInput.value : 'Artisan Professionnel';
    
    window.aiAssessment.startAssessment(prof, { name, profession: prof });
}

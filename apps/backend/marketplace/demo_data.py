"""Demonstration catalogue and administrative geography, never live commercial data.

Geography reference: https://bangladesh.gov.bd/views/district-list/
"""

DIVISIONS = {
    "Dhaka": "Dhaka,Faridpur,Gazipur,Gopalganj,Kishoreganj,Madaripur,Manikganj,Munshiganj,Narayanganj,Narsingdi,Rajbari,Shariatpur,Tangail".split(","),
    "Chattogram": "Chattogram,Bandarban,Brahmanbaria,Chandpur,Cumilla,Cox's Bazar,Feni,Khagrachhari,Lakshmipur,Noakhali,Rangamati".split(","),
    "Rajshahi": "Rajshahi,Bogura,Joypurhat,Naogaon,Natore,Chapainawabganj,Pabna,Sirajganj".split(","),
    "Khulna": "Khulna,Bagerhat,Chuadanga,Jashore,Jhenaidah,Kushtia,Magura,Meherpur,Narail,Satkhira".split(","),
    "Barishal": "Barishal,Barguna,Bhola,Jhalokati,Patuakhali,Pirojpur".split(","),
    "Sylhet": "Sylhet,Habiganj,Moulvibazar,Sunamganj".split(","),
    "Rangpur": "Rangpur,Dinajpur,Gaibandha,Kurigram,Lalmonirhat,Nilphamari,Panchagarh,Thakurgaon".split(","),
    "Mymensingh": "Mymensingh,Jamalpur,Netrokona,Sherpur".split(","),
}

# Each family has ten distinct items and ten commercially plausible pack sizes.
CATALOGUE = [
    ("Rice & grains", "Miniket rice,Nazirshail rice,Basmati rice,Chinigura rice,Brown rice,Red rice,Sticky rice,Flattened rice,Puffed rice,Broken rice", "dry", 90),
    ("Lentils & pulses", "Red lentils,Yellow lentils,Mung beans,Chickpeas,Black gram,White peas,Split peas,Kidney beans,Black eyed beans,Chana dal", "dry", 140),
    ("Flour & baking", "Whole wheat flour,White flour,Rice flour,Corn flour,Chickpea flour,Semolina,Oat flour,Bread flour,Cake flour,Millet flour", "dry", 80),
    ("Spices", "Turmeric powder,Chilli powder,Cumin powder,Coriander powder,Black pepper,Cinnamon,Cardamom,Cloves,Bay leaves,Garam masala", "spice", 480),
    ("Cooking oils", "Soybean oil,Mustard oil,Sunflower oil,Rice bran oil,Olive oil,Coconut oil,Sesame oil,Canola oil,Corn oil,Groundnut oil", "liquid", 230),
    ("Fresh vegetables", "Fresh potato,Fresh tomato,Fresh carrot,Fresh cucumber,Fresh eggplant,Fresh okra,Fresh cabbage,Fresh cauliflower,Fresh green beans,Fresh pumpkin", "dry", 70),
    ("Fresh fruits", "Fresh apple,Fresh orange,Fresh mango,Fresh guava,Fresh banana,Fresh papaya,Fresh pineapple,Fresh grapes,Fresh pear,Fresh pomegranate", "dry", 190),
    ("Leafy greens", "Fresh spinach,Fresh red amaranth,Fresh water spinach,Fresh coriander,Fresh mint,Fresh lettuce,Fresh mustard greens,Fresh fenugreek leaves,Fresh kale,Fresh basil", "spice", 100),
    ("Dried fruits", "Dates,Raisins,Dried apricots,Dried figs,Dried prunes,Dried mango,Dried pineapple,Dried cranberries,Dried apple,Dried banana", "spice", 650),
    ("Nuts & seeds", "Almonds,Cashews,Walnuts,Pistachios,Peanuts,Pumpkin seeds,Sunflower seeds,Chia seeds,Flax seeds,Sesame seeds", "spice", 700),
    ("Tea & coffee", "Black tea,Green tea,Masala tea,Ginger tea,Lemon tea,Mint tea,Instant coffee,Ground coffee,Decaf coffee,Cocoa powder", "spice", 550),
    ("Milk & dairy", "Whole milk,Low fat milk,Skimmed milk,Lactose free milk,Chocolate milk,Strawberry milk,Vanilla milk,Almond drink,Oat drink,Soy drink", "liquid", 120),
    ("Juices", "Mango juice,Orange juice,Apple juice,Pineapple juice,Guava juice,Lychee juice,Grape juice,Pomegranate juice,Mixed fruit juice,Lemon drink", "liquid", 150),
    ("Breakfast", "Rolled oats,Quick oats,Corn flakes,Bran flakes,Granola,Muesli,Rice flakes,Wheat flakes,Chocolate cereal,Multigrain cereal", "dry", 280),
    ("Biscuits", "Butter biscuits,Milk biscuits,Digestive biscuits,Chocolate cookies,Oat cookies,Coconut cookies,Salted crackers,Cream crackers,Shortbread,Ginger biscuits", "spice", 350),
    ("Snacks", "Potato chips,Banana chips,Chanachur,Roasted chickpeas,Popcorn,Rice crackers,Cheese puffs,Pretzels,Tortilla chips,Lentil crisps", "spice", 320),
    ("Pasta & noodles", "Spaghetti,Penne,Fusilli,Macaroni,Farfalle,Rice noodles,Egg noodles,Vermicelli,Whole wheat pasta,Lasagne sheets", "dry", 240),
    ("Sauces", "Tomato ketchup,Chilli sauce,Soy sauce,Garlic sauce,Barbecue sauce,Sweet chilli sauce,Mustard sauce,Pasta sauce,Pizza sauce,Tamarind sauce", "liquid", 260),
    ("Honey & spreads", "Flower honey,Litchi honey,Mustard honey,Peanut butter,Almond butter,Chocolate spread,Strawberry jam,Orange marmalade,Mango jam,Mixed fruit jam", "spice", 500),
    ("Salt & sugar", "White sugar,Brown sugar,Powdered sugar,Rock sugar,Cane jaggery,Date jaggery,Iodized salt,Sea salt,Rock salt,Black salt", "dry", 110),
    ("Frozen vegetables", "Frozen peas,Frozen corn,Frozen carrots,Frozen broccoli,Frozen cauliflower,Frozen spinach,Frozen green beans,Frozen okra,Frozen mixed vegetables,Frozen pumpkin", "dry", 220),
    ("Cleaning liquids", "Home floor cleaner,Dishwashing liquid,Glass cleaner,Bathroom cleaner,Kitchen degreaser,Liquid detergent,Fabric softener,Surface cleaner,Tile cleaner,Wood floor cleaner", "liquid", 180),
    ("Personal care", "Aloe shampoo,Coconut shampoo,Herbal shampoo,Daily conditioner,Body wash,Hand wash,Body lotion,Rose shower gel,Shea shower gel,Face cleanser", "liquid", 400),
    ("Pet pantry", "Adult cat food,Kitten food,Adult dog food,Puppy food,Fish food,Bird seed,Rabbit feed,Cat treats,Dog treats,Parrot feed", "dry", 450),
    ("Whole grains", "Quinoa,Barley,Millet,Buckwheat,Sorghum,Amaranth grain,Bulgur,Couscous,Whole oats,Whole rye", "dry", 260),
]

PACKS = {
    "dry": [(n, "g") for n in (250, 500, 750, 1000, 1250, 1500, 2000, 2500, 3000, 5000)],
    "spice": [(n, "g") for n in (50, 100, 150, 200, 250, 300, 400, 500, 750, 1000)],
    "liquid": [(n, "ml") for n in (100, 200, 250, 300, 500, 750, 1000, 1500, 2000, 3000)],
}

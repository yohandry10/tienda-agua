// Retail (Hogar) delivery coverage.
export const districts = ["Magdalena", "San Isidro", "Miraflores", "Barranco", "Surco", "Surquillo", "Jesús María", "Lince", "Pueblo Libre", "San Luis", "San Borja", "San Miguel", "Breña", "La Victoria (Santa Catalina)"] as const;
// Wholesale (Empresa) delivery coverage: every district of Lima.
export const businessDistricts = ["Ancón", "Ate", "Barranco", "Breña", "Carabayllo", "Cercado de Lima", "Chaclacayo", "Chorrillos", "Cieneguilla", "Comas", "El Agustino", "Independencia", "Jesús María", "La Molina", "La Victoria", "Lince", "Los Olivos", "Lurigancho", "Lurín", "Magdalena", "Miraflores", "Pachacámac", "Pucusana", "Pueblo Libre", "Puente Piedra", "Punta Hermosa", "Punta Negra", "Rímac", "San Bartolo", "San Borja", "San Isidro", "San Juan de Lurigancho", "San Juan de Miraflores", "San Luis", "San Martín de Porres", "San Miguel", "Santa Anita", "Santa María del Mar", "Santa Rosa", "Surco", "Surquillo", "Villa El Salvador", "Villa María del Triunfo"] as const;
export const districtsFor = (kind: string): readonly string[] => kind === "Empresa" ? businessDistricts : districts;
export const products = [
 { id: "bidon", name: "Bidón de 20 L", subtitle: "Para toda la casa", price: 3000, min: 1, image: "/assets/bidon.png", detail: "Primera compra: agua + envase retornable con caño." },
 { id: "recarga", name: "Recarga de 20 L", subtitle: "Tu bidón, una nueva vida", price: 1600, min: 1, image: "/assets/bidon.png", detail: "Recarga para tu bidón retornable. Entrega incluida." },
 { id: "caja", name: "Caja de 20 L", subtitle: "Práctica, estés donde estés", price: 2400, min: 1, image: "/assets/caja.png", detail: "Agua alcalina en una presentación práctica de 20 litros." },
 { id: "pack", name: "Pack de 15 botellas", subtitle: "500 ml para llevar", price: 3000, min: 3, image: "/assets/pack-etiqueta-real.png", detail: "15 botellas de 500 ml por pack. Pedido mínimo: 3 packs." },
] as const;
export type ProductId = typeof products[number]["id"];
export type CartItem = { id: ProductId; qty: number };
export const money = (cents: number) => "S/ " + (cents / 100).toFixed(2);
export const findProduct = (id: string) => products.find(p => p.id === id);
export const whatsapp = (text = "Hola VAIYO, quisiera información sobre sus productos.") => "https://wa.me/51967232782?text=" + encodeURIComponent(text);


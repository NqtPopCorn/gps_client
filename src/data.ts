import { POI } from "./types";

export const mockPOIs: POI[] = [
  {
    id: "1",
    name: "Grand Palace",
    description:
      "The Grand Palace is a complex of buildings at the heart of Bangkok, Thailand. The palace has been the official residence of the Kings of Siam since 1782.",
    image: "https://picsum.photos/seed/palace/800/600",
    lat: 13.75,
    lng: 100.4913,
    rating: 4.8,
    duration: "12:45",
    visited: true,
  },
  {
    id: "2",
    name: "Wat Pho",
    description:
      "Wat Pho is a Buddhist temple complex in the Phra Nakhon District, Bangkok, Thailand. It is on Rattanakosin Island, directly south of the Grand Palace.",
    image: "https://picsum.photos/seed/temple/800/600",
    lat: 13.7465,
    lng: 100.4933,
    rating: 4.7,
    duration: "08:30",
    visited: false,
  },
  {
    id: "3",
    name: "Chatuchak Market",
    description:
      "The Chatuchak Weekend Market, on Kamphaeng Phet 2 Road, Chatuchak, Bangkok, is the largest market in Thailand. Also known as JJ Market.",
    image: "https://picsum.photos/seed/market/800/600",
    lat: 13.7999,
    lng: 100.5509,
    rating: 4.5,
    duration: "15:20",
    visited: false,
  },
  {
    id: "4",
    name: "Lumphini Park",
    description:
      "Lumphini Park is a 360-rai park in Bangkok, Thailand. The park offers rare open public space, trees, and playgrounds in the Thai capital.",
    image: "https://picsum.photos/seed/park/800/600",
    lat: 13.7314,
    lng: 100.5415,
    rating: 4.6,
    duration: "05:15",
    visited: true,
  },
];

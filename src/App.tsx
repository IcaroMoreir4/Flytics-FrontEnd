import { useState, useEffect } from "react";
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import OrigemIcon from "../src/assets/icons/origemIcon.svg";
import DestinoIcon from "../src/assets/icons/destinoIcon.svg";
import CalendarIcon from "../src/assets/icons/calendarioIcon.svg";
import DataSelecionadaIcon from "../src/assets/icons/dataSelecionadaIcon.svg";
import AviaoIcon from "../src/assets/icons/aviaoIcon.svg";
import InverterIcon from "../src/assets/icons/inverterIcon.svg";
import Header from "./components/Header";

// -------------------------------
// TYPES
// -------------------------------
type Airport = {
  code: string;
  name: string;
  country: string;
  iata_code: string;
};

type Flight = {
  origin: string;
  destination: string;
  date: string;
  price: number;
  type?: "ida" | "volta";
};

type AlternativeFlight = {
  date: string;
  price: number;
  isCheaper: boolean;
};

export default function App() {
  // -------------------------------
  // STATES
  // -------------------------------
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [departureDate, setDepartureDate] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [showResults, setShowResults] = useState(false);

  const [originSuggestions, setOriginSuggestions] = useState<Airport[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Airport[]>([]);
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false);
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false);

  const [airports, setAirports] = useState<Airport[]>([]);
  const [isLoadingAirports, setIsLoadingAirports] = useState(false);
  const [priceData, setPriceData] = useState<Flight[]>([]);

  const [minHistoric, setMinHistoric] = useState<number | null>(null);
  const [maxHistoric, setMaxHistoric] = useState<number | null>(null);

  const [outboundAlternatives, setOutboundAlternatives] = useState<AlternativeFlight[]>([]);
  const [returnAlternatives, setReturnAlternatives] = useState<AlternativeFlight[]>([]);

  // -------------------------------
  // HELPERS
  // -------------------------------
  const roundToTens = (n: number) => Math.round(n / 10) * 10;
  const fmtBR = (n: number) => n.toLocaleString("pt-BR");

  const outboundFlights = priceData.filter(f => f.type === "ida");
  const returnFlights = priceData.filter(f => f.type === "volta");


  // -------------------------------
  // LOAD AIRPORTS
  // -------------------------------
  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setIsLoadingAirports(true);
        const res = await fetch("http://localhost:3001/api/flights/airports");
        const data = await res.json();
        if (isMounted) setAirports(data);
      } catch (e) {
        console.error("Falha ao carregar aeroportos:", e);
      } finally {
        if (isMounted) setIsLoadingAirports(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------
  // AUTOCOMPLETE FORMAT
  // -------------------------------
  const airportDisplay = (a: Airport) => {
    return `${a.name}, ${a.country} (${a.iata_code})`;
  };

  const filterCities = (searchTerm: string, otherValue: string, showAll = false): Airport[] => {
    const term = searchTerm.trim().toLowerCase();
    let results = airports;

    if (!showAll) {
      if (term.length < 2) return [];
      results = airports.filter(a => {
        const hay = `${a.name} ${a.country} ${a.iata_code}`.toLowerCase();
        return hay.includes(term);
      });
    }

    return results.filter(a => a.code !== otherValue).slice(0, 10);
  };

  // -------------------------------
  // 🔥 FUNÇÕES QUE ESTAVAM FALTANDO
  // -------------------------------
  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOrigin(value);

    const suggestions = filterCities(value, destination);
    setOriginSuggestions(suggestions);
    setShowOriginSuggestions(true);
  };

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestination(value);

    const suggestions = filterCities(value, origin);
    setDestinationSuggestions(suggestions);
    setShowDestinationSuggestions(true);
  };

  // -------------------------------
  // ALTERNATIVE DATES
  // -------------------------------
  const getAlternativeDates = (baseDate: string, count: number = 2): string[] => {
    const dates: string[] = [];
    const base = new Date(baseDate);

    for (let i = 1; i <= count; i++) {
      const prevDate = new Date(base);
      prevDate.setDate(base.getDate() - i);
      dates.push(prevDate.toISOString().split('T')[0]);
    }

    for (let i = 1; i <= count; i++) {
      const nextDate = new Date(base);
      nextDate.setDate(base.getDate() + i);
      dates.push(nextDate.toISOString().split('T')[0]);
    }

    return dates;
  };

  const calculateAlternativeFlights = (baseFlight: Flight, allFlights: Flight[], type: "ida" | "volta") => {
    const alternativeDates = getAlternativeDates(baseFlight.date, 2);
    const alternatives: AlternativeFlight[] = [];

    alternativeDates.forEach(date => {
      const flight = allFlights.find(f => f.date === date && f.type === type);
      if (flight) {
        alternatives.push({
          date: flight.date,
          price: flight.price,
          isCheaper: flight.price < baseFlight.price
        });
      }
    });

    return alternatives.slice(0, 2);
  };

  // -------------------------------
  // LOAD HISTORY
  // -------------------------------
  const loadHistory = async () => {
    try {
      const res = await fetch(
        `http://localhost:3001/api/flights/history?origin=${origin}&destination=${destination}`
      );
      const data = await res.json();

      setMinHistoric(data.min_historic);
      setMaxHistoric(data.max_historic);

    } catch (e) {
      console.error("Erro ao carregar histórico", e);
    }
  };

  // -------------------------------
  // SEARCH FLIGHTS
  // -------------------------------
  const handleSearch = async () => {
    if (!origin || !destination || !departureDate) return;

    const query = new URLSearchParams({
      origin,
      destination,
      departure: departureDate,
      return: returnDate || ""
    }).toString();

    try {
      const res = await fetch(`http://localhost:3001/api/flights?${query}`);
      const data = await res.json();
      setPriceData(data);
      setShowResults(true);

      const userOutboundFlight = data.find((f: Flight) => f.date === departureDate && f.type === "ida");
      const userReturnFlight = data.find((f: Flight) => f.date === returnDate && f.type === "volta");

      if (userOutboundFlight) {
        setOutboundAlternatives(calculateAlternativeFlights(userOutboundFlight, data, "ida"));
      }

      if (userReturnFlight) {
        setReturnAlternatives(calculateAlternativeFlights(userReturnFlight, data, "volta"));
      }

    } catch (err) {
      console.error("Erro ao buscar voos:", err);
    }

    await loadHistory();
  };

  // -------------------------------
  // SWAP
  // -------------------------------
  const handleSwapOriginDestination = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setOriginSuggestions([]);
    setDestinationSuggestions([]);
    setShowOriginSuggestions(false);
    setShowDestinationSuggestions(false);
  };

  // -------------------------------
  // DATE FORMAT
  // -------------------------------
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Selecione uma data";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // -------------------------------
  // PRICE COLOR
  // -------------------------------
  const getPriceIndicator = (price: number) => {
    if (price <= 1500) return { color: "bg-green-500", text: "Bom preço" };
    if (price <= 1800) return { color: "bg-yellow-500", text: "Preço razoável" };
    return { color: "bg-red-500", text: "Preço alto" };
  };

  // -------------------------------
  // UI
  // -------------------------------
  return (
    <div className="min-h-screen bg-[#DAEAF3]">
      <Header />

      {/* ================= FORM ================= */}
      <section className="min-h-[70vh] flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-5xl text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">

            {/* Título */}
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Encontre a <span className="text-blue-600">melhor data</span> para sua viagem
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Compare preços de passagens aéreas e descubra quando é mais barato viajar para o seu destino dos sonhos.
              </p>
            </div>

            {/* ---------------- FORM ---------------- */}
            <div className="space-y-6">

              {/* ORIGEM + DESTINO */}
              <div className="flex flex-col md:flex-row gap-6 items-end">

                {/* ORIGEM */}
                <div className="flex-1 relative">
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <img src={OrigemIcon} className="w-5 h-5" />
                    De onde você parte?
                  </label>
                  <Input
                    placeholder={isLoadingAirports ? "Carregando aeroportos..." : "Ex.: São Paulo (GRU)"}
                    value={origin}
                    onChange={handleOriginChange}
                    onFocus={() => {
                      const suggestions = filterCities(origin, destination, true);
                      setOriginSuggestions(suggestions);
                      setShowOriginSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                    className="h-12 text-lg"
                  />

                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {originSuggestions.map((a, i) => (
                        <div
                          key={i}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setOrigin(a.code);
                            setShowOriginSuggestions(false);
                          }}
                        >
                          {airportDisplay(a)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DESTINO */}
                <div className="flex-1 relative">
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <img src={DestinoIcon} className="w-5 h-5" />
                    Para onde você vai?
                  </label>
                  <Input
                    placeholder={isLoadingAirports ? "Carregando aeroportos..." : "Ex.: Fortaleza (FOR)"}
                    value={destination}
                    onChange={handleDestinationChange}
                    onFocus={() => {
                      const suggestions = filterCities(destination, origin, true);
                      setDestinationSuggestions(suggestions);
                      setShowDestinationSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                    className="h-12 text-lg"
                  />

                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {destinationSuggestions.map((a, i) => (
                        <div
                          key={i}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setDestination(a.code);
                            setShowDestinationSuggestions(false);
                          }}
                        >
                          {airportDisplay(a)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* DATAS */}
              <div className="flex flex-col md:flex-row gap-6 items-end pt-4">
                <div className="flex-1">
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <img src={CalendarIcon} className="w-5 h-5" />
                    Data de ida *
                  </label>
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                <div className="flex-1">
                  <label className="flex items-center gap-2 mb-2 text-sm font-medium text-gray-700">
                    <img src={CalendarIcon} className="w-5 h-5" />
                    Data de volta (opcional)
                  </label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
              </div>

              {/* SWAP */}
              <div className="flex justify-center">
                <button
                  onClick={handleSwapOriginDestination}
                  className="p-2 rounded-full hover:bg-gray-200 transition"
                  title="Trocar origem e destino"
                >
                  <img src={InverterIcon} className="cursor-pointer" />
                </button>
              </div>

              {/* BOTÃO */}
              <div className="pt-4">
                <Button
                  onClick={handleSearch}
                  className="w-full md:w-auto px-12 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 h-14 transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-60"
                  disabled={!origin || !destination || !departureDate || origin.trim() === destination.trim()}
                >
                  <img src="/src/assets/icons/lupaIcon.svg" className="w-5 h-5 mr-2" />
                  Pesquisar Melhores Preços
                </Button>
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* ================= RESULTADOS ================= */}
      {showResults && priceData.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 space-y-12 pt-8 pb-16">

          {/* Cabeçalho */}
          <div className="flex flex-col items-center text-gray-700 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="font-medium">{origin}</span>
              <span className="w-16 h-px bg-gray-300" />
              <img src={AviaoIcon} className="w-4 h-4" />
              <span className="w-16 h-px bg-gray-300" />
              <span className="font-medium">{destination}</span>
            </div>

            <p className="text-sm text-gray-600">
              Ida: <strong>{formatDateForDisplay(departureDate)}</strong>
              {returnDate && <> | Volta: <strong>{formatDateForDisplay(returnDate)}</strong></>}
            </p>
          </div>

          {/* Histórico */}
          {minHistoric !== null && maxHistoric !== null && (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Card className="bg-blue-50 border border-blue-300 shadow-sm">
                <CardContent className="py-4 text-center">
                  <p className="text-sm text-gray-600">Menor preço HISTÓRICO</p>
                  <p className="text-2xl font-bold text-blue-700">R$ {fmtBR(minHistoric)}</p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border border-blue-300 shadow-sm">
                <CardContent className="py-4 text-center">
                  <p className="text-sm text-gray-600">Maior preço HISTÓRICO</p>
                  <p className="text-2xl font-bold text-blue-700">R$ {fmtBR(maxHistoric)}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* IDA */}
          {outboundFlights.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                <img src={AviaoIcon} className="w-5 h-5" />
                Ida
              </h2>

              <div className="space-y-6">
                {outboundFlights.map((f, i) => (
                  <div key={i}>
                    <Card className="border border-[#7BFFF0] shadow-lg bg-white">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <img src={DataSelecionadaIcon} />
                          <CardTitle className="text-xl font-bold">{formatDateForDisplay(f.date)}</CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full ${getPriceIndicator(f.price).color}`} />
                          <p className="text-3xl font-bold text-gray-900">R$ {fmtBR(f.price)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Alternativas para IDA */}
                    {f.date === departureDate && outboundAlternatives.length > 0 && (
                      <div className="mt-4 ml-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">
                          Alternativas para economizar:
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {outboundAlternatives.map((alt, idx) => (
                            <Card key={idx} className={`border ${alt.isCheaper ? 'border-green-400' : 'border-yellow-400'} bg-white shadow-sm`}>
                              <CardContent className="py-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">{formatDateForDisplay(alt.date)}</p>
                                    <p className={`text-xl font-bold ${alt.isCheaper ? 'text-green-600' : 'text-yellow-600'}`}>
                                      R$ {fmtBR(alt.price)}
                                    </p>
                                  </div>
                                  {alt.isCheaper && (
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                      Mais barato
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VOLTA */}
          {returnFlights.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-4 flex items-center gap-2">
                <img src={AviaoIcon} className="w-5 h-5 rotate-180" />
                Volta
              </h2>

              <div className="space-y-6">
                {returnFlights.map((f, i) => (
                  <div key={i}>
                    <Card className="border border-[#7BFFF0] shadow-lg bg-white">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <img src={DataSelecionadaIcon} />
                          <CardTitle className="text-xl font-bold">{formatDateForDisplay(f.date)}</CardTitle>
                        </div>
                      </CardHeader>

                      <CardContent>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full ${getPriceIndicator(f.price).color}`} />
                          <p className="text-3xl font-bold text-gray-900">R$ {fmtBR(f.price)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Alternativas para VOLTA */}
                    {f.date === returnDate && returnAlternatives.length > 0 && (
                      <div className="mt-4 ml-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-3">
                          Alternativas para economizar:
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {returnAlternatives.map((alt, idx) => (
                            <Card key={idx} className={`border ${alt.isCheaper ? 'border-green-400' : 'border-yellow-400'} bg-white shadow-sm`}>
                              <CardContent className="py-3">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-sm font-medium text-gray-600">{formatDateForDisplay(alt.date)}</p>
                                    <p className={`text-xl font-bold ${alt.isCheaper ? 'text-green-600' : 'text-yellow-600'}`}>
                                      R$ {fmtBR(alt.price)}
                                    </p>
                                  </div>
                                  {alt.isCheaper && (
                                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded">
                                      Mais barato
                                    </span>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </section>
      )}

      <Footer />
    </div>
  );
}

import { useState, useEffect } from "react"
import Footer from "@/components/Footer";
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import OrigemIcon from "../src/assets/icons/origemIcon.svg"
import DestinoIcon from "../src/assets/icons/destinoIcon.svg"
import CalendarIcon from "../src/assets/icons/calendarioIcon.svg"
import DataSelecionadaIcon from "../src/assets/icons/dataSelecionadaIcon.svg"
import AviaoIcon from "../src/assets/icons/aviaoIcon.svg"
import InverterIcon from "../src/assets/icons/inverterIcon.svg"
import Header from "./components/Header";

type Airport = {
  name: string
  city: string
  country: string
  iata_code: string | null
}

type Flight = {
  origin: string
  destination: string
  date: string
  price: number
  type?: "ida" | "volta"
}

export default function App() {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [departureDate, setDepartureDate] = useState("")
  const [returnDate, setReturnDate] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [airports, setAirports] = useState<Airport[]>([])
  const [isLoadingAirports, setIsLoadingAirports] = useState(false)
  const [priceData, setPriceData] = useState<Flight[]>([])

  // helpers
  const roundToTens = (n: number) => Math.round(n / 10) * 10
  const fmtBR = (n: number) => n.toLocaleString("pt-BR")

  // filtra tipos
  const outboundFlights = priceData.filter(f => f.type === "ida")
  const returnFlights = priceData.filter(f => f.type === "volta")

  // extremos com arredondamento (dezenas)
  const minOutbound = outboundFlights.length ? roundToTens(Math.min(...outboundFlights.map(f => f.price))) : null
  const maxOutbound = outboundFlights.length ? roundToTens(Math.max(...outboundFlights.map(f => f.price))) : null
  const minReturn   = returnFlights.length   ? roundToTens(Math.min(...returnFlights.map(f => f.price)))   : null
  const maxReturn   = returnFlights.length   ? roundToTens(Math.max(...returnFlights.map(f => f.price)))   : null

  // aeroportos
  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setIsLoadingAirports(true)
        const res = await fetch('http://localhost:3000/api/flights/airports')
        const data = await res.json()
        const withIata = data.filter((a: Airport) => a.iata_code)
        if (isMounted) setAirports(withIata)
      } catch (e) {
        console.error('Falha ao carregar aeroportos', e)
      } finally {
        if (isMounted) setIsLoadingAirports(false)
      }
    }
    load()
    return () => { isMounted = false }
  }, [])

  // busca preços
  const handleSearch = async () => {
    if (!origin || !destination || !departureDate) return
    try {
      const query = new URLSearchParams({
        origin,
        destination,
        departure: departureDate,
        return: returnDate || ""
      }).toString()

      const res = await fetch(`http://localhost:3000/api/flights?${query}`)
      const data = await res.json()
      setPriceData(data)
      setShowResults(true)
    } catch (err) {
      console.error("Erro ao buscar voos:", err)
    }
  }

  // swap
  const handleSwapOriginDestination = () => {
    const temp = origin
    setOrigin(destination)
    setDestination(temp)
    setOriginSuggestions([])
    setDestinationSuggestions([])
    setShowOriginSuggestions(false)
    setShowDestinationSuggestions(false)
  }

  // data legível
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Selecione uma data"
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, (month || 1) - 1, day || 1)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // airport display + sugestões
  const airportDisplay = (a: Airport) => {
    const iata = a.iata_code ?? ''
    const parts = [a.city, a.country].filter(Boolean).join(', ')
    return `${parts} (${iata})`
  }

  const filterCities = (searchTerm: string, otherValue: string, showAll = false) => {
    const term = searchTerm.trim().toLowerCase()
    let results = airports

    if (!showAll) {
      if (term.length < 2) return []
      results = airports.filter(a => {
        const hay = `${a.name} ${a.city} ${a.country} ${a.iata_code ?? ''}`.toLowerCase()
        return hay.includes(term)
      }).slice(0, 20)
    }

    const displays = results.map(airportDisplay).filter(display => display && display !== otherValue)
    const seen = new Set<string>()
    const unique: string[] = []
    for (const d of displays) {
      if (!seen.has(d)) { seen.add(d); unique.push(d) }
    }
    return unique.slice(0, 10)
  }

  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOrigin(value)
    const suggestions = filterCities(value, destination)
    setOriginSuggestions(suggestions)
    setShowOriginSuggestions(suggestions.length > 0)
  }

  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDestination(value)
    const suggestions = filterCities(value, origin)
    setDestinationSuggestions(suggestions)
    setShowDestinationSuggestions(suggestions.length > 0)
  }

  // indicador de preço
  const getPriceIndicator = (price: number) => {
    if (price <= 1500) return { color: "bg-green-500", text: "Bom preço" }
    if (price <= 1800) return { color: "bg-yellow-500", text: "Preço razoável" }
    return { color: "bg-red-500", text: "Preço alto" }
  }

  return (
    <div className="min-h-screen bg-[#DAEAF3]">
      <Header />

      <section className="min-h-[70vh] flex items-center justify-center p-6 md:p-8">
        <div className="w-full max-w-5xl text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Encontre a <span className="text-blue-600">melhor data</span> para sua viagem
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Compare preços de passagens aéreas e descubra quando é mais barato viajar para o seu destino dos sonhos.
              </p>
            </div>

            {/* Formulário */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 items-end">
                {/* ORIGEM */}
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={OrigemIcon} alt="Origem" className="w-5 h-5" />
                    <label className="text-sm font-medium text-gray-700">De onde você parte?</label>
                  </div>
                  <Input
                    placeholder={isLoadingAirports ? "Carregando aeroportos..." : "Ex.: São Paulo, Brasil (GRU)"}
                    value={origin}
                    onChange={handleOriginChange}
                    onFocus={() => {
                      const suggestions = filterCities(origin, destination, true)
                      setOriginSuggestions(suggestions)
                      setShowOriginSuggestions(true)
                    }}
                    onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                    className="h-12 text-lg"
                  />
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {originSuggestions.map((city, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => { setOrigin(city); setShowOriginSuggestions(false); }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DESTINO */}
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={DestinoIcon} alt="Destino" className="w-5 h-5" />
                    <label className="text-sm font-medium text-gray-700">Para onde você vai?</label>
                  </div>
                  <Input
                    placeholder={isLoadingAirports ? "Carregando aeroportos..." : "Ex.: Paris, France (CDG)"}
                    value={destination}
                    onChange={handleDestinationChange}
                    onFocus={() => {
                      const suggestions = filterCities(destination, origin, true)
                      setDestinationSuggestions(suggestions)
                      setShowDestinationSuggestions(true)
                    }}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                    className="h-12 text-lg"
                  />
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {destinationSuggestions.map((city, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => { setDestination(city); setShowDestinationSuggestions(false); }}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Datas */}
              <div className="flex flex-col md:flex-row gap-6 items-end pt-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={CalendarIcon} alt="Ida" className="w-5 h-5" />
                    <label className="text-sm font-medium text-gray-700">Data de ida *</label>
                  </div>
                  <Input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={CalendarIcon} alt="Volta" className="w-5 h-5" />
                    <label className="text-sm font-medium text-gray-700">Data de volta (opcional)</label>
                  </div>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="h-12 text-lg"
                  />
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={handleSwapOriginDestination}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200"
                  title="Trocar origem e destino"
                >
                  <img src={InverterIcon} alt="Trocar" className="cursor-pointer" />
                </button>
              </div>

              <div className="pt-4">
                <Button
                  onClick={handleSearch}
                  className="w-full md:w-auto px-12 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 h-14 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-60"
                  disabled={!origin || !destination || !departureDate || origin.trim() === destination.trim()}
                >
                  <img src="/src/assets/icons/lupaIcon.svg" alt="Buscar" className="w-5 h-5 mr-2" />
                  Pesquisar Melhores Preços
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resultados */}
      {showResults && priceData.length > 0 && (
        <section className="max-w-5xl mx-auto px-4 space-y-12 pt-8 pb-16">
          {/* Cabeçalho geral */}
          <div className="flex flex-col items-center text-gray-700 space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="font-medium">{origin}</span>
              <span className="w-16 h-px bg-gray-300" />
              <img src={AviaoIcon} alt="Avião" className="w-4 h-4" />
              <span className="w-16 h-px bg-gray-300" />
              <span className="font-medium">{destination}</span>
            </div>

            <p className="text-sm text-gray-600">
              Ida: <strong>{formatDateForDisplay(departureDate)}</strong>
              {returnDate && (
                <> &nbsp;|&nbsp; Volta: <strong>{formatDateForDisplay(returnDate)}</strong></>
              )}
            </p>
          </div>

          {/* ==== IDA ==== */}
          {outboundFlights.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center gap-2">
                <img src={AviaoIcon} alt="Ida" className="w-5 h-5" />
                Ida
              </h2>

              {/* Estatísticas - IDA (topo) */}
              {minOutbound !== null && maxOutbound !== null && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="bg-green-50 border border-green-300 shadow-sm">
                    <CardContent className="py-4 text-center">
                      <p className="text-sm text-gray-600">Menor preço da IDA</p>
                      <p className="text-2xl font-bold text-green-700">
                        R$ {fmtBR(minOutbound)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 border border-red-300 shadow-sm">
                    <CardContent className="py-4 text-center">
                      <p className="text-sm text-gray-600">Maior preço da IDA</p>
                      <p className="text-2xl font-bold text-red-700">
                        R$ {fmtBR(maxOutbound)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Cards de IDA */}
              <div className="space-y-6">
                {outboundFlights.map((f, i) => (
                  <Card key={`ida-${i}`} className="border border-[#7BFFF0] shadow-lg bg-white">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <img src={DataSelecionadaIcon} alt="Data" />
                        <CardTitle className="text-xl font-bold">
                          {formatDateForDisplay(f.date)}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${getPriceIndicator(f.price).color}`} />
                        <p className="text-3xl font-bold text-gray-900">
                          R$ {fmtBR(f.price)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ==== VOLTA ==== */}
          {returnFlights.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-green-600 mb-4 flex items-center gap-2">
                <img src={AviaoIcon} alt="Volta" className="w-5 h-5 rotate-180" />
                Volta
              </h2>

              {/* Estatísticas - VOLTA (topo) */}
              {minReturn !== null && maxReturn !== null && (
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <Card className="bg-green-50 border border-green-300 shadow-sm">
                    <CardContent className="py-4 text-center">
                      <p className="text-sm text-gray-600">Menor preço da VOLTA</p>
                      <p className="text-2xl font-bold text-green-700">
                        R$ {fmtBR(minReturn)}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 border border-red-300 shadow-sm">
                    <CardContent className="py-4 text-center">
                      <p className="text-sm text-gray-600">Maior preço da VOLTA</p>
                      <p className="text-2xl font-bold text-red-700">
                        R$ {fmtBR(maxReturn)}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Cards de VOLTA */}
              <div className="space-y-6">
                {returnFlights.map((f, i) => (
                  <Card key={`volta-${i}`} className="border border-[#7BFFF0] shadow-lg bg-white">
                    <CardHeader className="pb-4">
                      <div className="flex items-center gap-3">
                        <img src={DataSelecionadaIcon} alt="Data" />
                        <CardTitle className="text-xl font-bold">
                          {formatDateForDisplay(f.date)}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full ${getPriceIndicator(f.price).color}`} />
                        <p className="text-3xl font-bold text-gray-900">
                          R$ {fmtBR(f.price)}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      <Footer />
    </div>
  )
}
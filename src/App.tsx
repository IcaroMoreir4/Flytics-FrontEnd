import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import OrigemIcon from "../src/assets/icons/origemIcon.svg"
import DestinoIcon from "../src/assets/icons/destinoIcon.svg"
import CalendarIcon from "../src/assets/icons/calendarioIcon.svg"
import DataSelecionadaIcon from "../src/assets/icons/dataSelecionadaIcon.svg"
import AvisoIcon from "../src/assets/icons/avisoIcon.svg"
import GraficoDescrecenteIcon from "../src/assets/icons/graficoDescrecenteIcon.svg"
import AviaoIcon from "../src/assets/icons/aviaoIcon.svg"
import InverterIcon from "../src/assets/icons/inverterIcon.svg"
import SacoDinheiroIcon from "../src/assets/icons/sacoDinheiroIcon.svg"

const priceData = [
  { date: "qui", price: 1800 },
  { date: "sex", price: 1850 },
  { date: "sáb", price: 1900 },
  { date: "dom", price: 1700 },
  { date: "seg", price: 1400 },
  { date: "ter", price: 2000 }, // data selecionada
  { date: "qua", price: 1600 },
  { date: "qui", price: 1750 },
  { date: "sex", price: 1500 },
]

// Autocomplete de aeroportos: dataset público Algolia
// Fonte JSON: https://raw.githubusercontent.com/algolia/datasets/master/airports/airports.json
// Tipo básico do item no dataset
type Airport = {
  name: string
  city: string
  country: string
  iata_code: string | null
}

export default function App() {
  const [origin, setOrigin] = useState("")
  const [destination, setDestination] = useState("")
  const [date, setDate] = useState("")
  const [showResults, setShowResults] = useState(false)
  const [originSuggestions, setOriginSuggestions] = useState<string[]>([])
  const [destinationSuggestions, setDestinationSuggestions] = useState<string[]>([])
  const [showOriginSuggestions, setShowOriginSuggestions] = useState(false)
  const [showDestinationSuggestions, setShowDestinationSuggestions] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const dateInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = () => {
    if (!origin || !destination || !date) return
    if (origin.trim() === destination.trim()) {
      alert("Origem e destino não podem ser iguais.")
      return
    }
    setShowResults(true)
  }

  // Função para trocar origem e destino
  const handleSwapOriginDestination = () => {
    const tempOrigin = origin
    setOrigin(destination)
    setDestination(tempOrigin)
    // Limpa as sugestões quando troca
    setOriginSuggestions([])
    setDestinationSuggestions([])
    setShowOriginSuggestions(false)
    setShowDestinationSuggestions(false)
  }

  // Função para obter a data mínima (hoje)
  const getMinDate = () => {
    const today = new Date()
    // Ajusta para fuso local para evitar deslocamento por UTC
    const tzOffsetInMs = today.getTimezoneOffset() * 60 * 1000
    const localDate = new Date(today.getTime() - tzOffsetInMs)
    return localDate.toISOString().split('T')[0]
  }

  // Função para formatar a data para exibição
  const formatDateForDisplay = (dateString: string) => {
    if (!dateString) return "Selecione uma data"
    // Interpreta a string YYYY-MM-DD como data local, sem aplicar UTC
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date(year, (month || 1) - 1, day || 1)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Função para lidar com a mudança da data
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    setShowDatePicker(false)
  }


  // useEffect para fechar o date picker quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.date-picker-container')) {
        setShowDatePicker(false)
      }
    }

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDatePicker])

  // Carrega dataset de aeroportos uma vez
  const [airports, setAirports] = useState<Airport[]>([])
  const [isLoadingAirports, setIsLoadingAirports] = useState(false)

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      try {
        setIsLoadingAirports(true)
        const res = await fetch('https://raw.githubusercontent.com/algolia/datasets/master/airports/airports.json')
        const data = await res.json()
        // Mantém apenas aeroportos com código IATA (comercialmente úteis)
        const withIata: Airport[] = data.filter((a: Airport) => a.iata_code)
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

  const airportDisplay = (a: Airport) => {
    const iata = a.iata_code ?? ''
    const parts = [a.city, a.country].filter(Boolean).join(', ')
    return `${parts} (${iata})`
  }

  // Função para filtrar com base no dataset de aeroportos
  const filterCities = (searchTerm: string, otherValue: string) => {
    const term = searchTerm.trim().toLowerCase()
    if (term.length < 2) return [] as string[]
    const results = airports.filter(a => {
      const hay = `${a.name} ${a.city} ${a.country} ${a.iata_code ?? ''}`.toLowerCase()
      return hay.includes(term)
    }).slice(0, 20) // resultados brutos

    const displays = results.map(airportDisplay)
      .filter(display => display && display !== otherValue)

    // remove duplicados mantendo ordem
    const seen = new Set<string>()
    const unique = [] as string[]
    for (const d of displays) {
      if (!seen.has(d)) { seen.add(d); unique.push(d) }
    }
    return unique.slice(0, 5)
  }

  // Handlers para origem
  const handleOriginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setOrigin(value)
    const suggestions = filterCities(value, destination)
    setOriginSuggestions(suggestions)
    setShowOriginSuggestions(suggestions.length > 0)
  }

  const handleOriginSelect = (city: string) => {
    if (city === destination) return // impede igualdade
    setOrigin(city)
    setShowOriginSuggestions(false)
  }

  // Handlers para destino
  const handleDestinationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setDestination(value)
    const suggestions = filterCities(value, origin)
    setDestinationSuggestions(suggestions)
    setShowDestinationSuggestions(suggestions.length > 0)
  }

  const handleDestinationSelect = (city: string) => {
    if (city === origin) return // impede igualdade
    setDestination(city)
    setShowDestinationSuggestions(false)
  }

  // Função para determinar a cor da bolinha baseada no preço
  const getPriceIndicator = (price: number) => {
    if (price <= 1500) {
      return { color: "bg-green-500", text: "Bom preço" }
    } else if (price <= 1800) {
      return { color: "bg-yellow-500", text: "Preço razoável" }
    } else {
      return { color: "bg-red-500", text: "Preço alto" }
    }
  }

  return (
    <div className="min-h-screen bg-[#DAEAF3]">
      {/* HEADER */}
      <header className="bg-white py-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4">
          <div className="flex items-center gap-2">
            <img src="/src/assets/logo.png" alt="Flytics" className="h-8" />
            <span className="font-bold text-lg text-[#3693C3]">Flytics</span>
          </div>
          <nav className="space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:underline">Como funciona</a>
            <a href="#" className="hover:underline">Contato</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-5xl text-center">

          {/* Titulo */}
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-5xl mx-auto">
            <div className="mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Encontre a <span className="text-blue-600">melhor data</span> para sua viagem
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Compare preços de passagens aéreas e descubra quando é mais barato viajar para o seu destino dos sonhos.
              </p>
            </div>

            {/* Search Form */}
            <div className="space-y-6">
              {/* Origin and Destination Row */}
              <div className="flex flex-col md:flex-row gap-6 items-end">
                {/* Origin */}
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={OrigemIcon} alt="Origem" className="w-5 h-5" />
                    <label className="text-sm font-medium text-gray-700">
                      De onde você parte?
                    </label>
                  </div>
                  <Input
                    placeholder={isLoadingAirports ? "Carregando aeroportos..." : "Ex.: Sao Paulo, Brasil (GRU)"}
                    value={origin}
                    onChange={handleOriginChange}
                    onFocus={() => setShowOriginSuggestions(originSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowOriginSuggestions(false), 200)}
                    className="h-12 text-lg"
                  />
                  {showOriginSuggestions && originSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {originSuggestions.map((city, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleOriginSelect(city)}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Destination */}
                <div className="flex-1 relative">
                  <div className="flex items-center gap-2 mb-2">
                    <img src={DestinoIcon} alt="Destino" className="w-5 h-5" />
                    <label className="text-sm font-medium text-gray-700">
                      Para onde você vai?
                    </label>
                  </div>
                  <Input
                    placeholder={isLoadingAirports ? "Carregando aeroportos..." : "Ex.: Paris, France (CDG)"}
                    value={destination}
                    onChange={handleDestinationChange}
                    onFocus={() => setShowDestinationSuggestions(destinationSuggestions.length > 0)}
                    onBlur={() => setTimeout(() => setShowDestinationSuggestions(false), 200)}
                    className="h-12 text-lg"
                  />
                  {showDestinationSuggestions && destinationSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {destinationSuggestions.map((city, index) => (
                        <div
                          key={index}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => handleDestinationSelect(city)}
                        >
                          {city}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Botão de Trocar */}
              <div className="flex justify-center md:justify-center">
                <button
                  onClick={handleSwapOriginDestination}
                  className="p-2 rounded-full hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
                  title="Trocar origem e destino"
                >
                  <img src={InverterIcon} alt="Trocar" className="cursor-pointer" />
                </button>
              </div>

              {/* Date Input */}
              <div className="max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-2">
                  <img src={CalendarIcon} alt="Data" className="w-5 h-5" />
                  <label className="text-sm font-medium text-gray-700">
                    Quando você quer viajar?
                  </label>
                </div>
                <div className="relative date-picker-container">
                  {/* Campo customizado que simula o input de data */}
                  <div
                    className="h-12 w-full px-4 py-3 text-lg border border-gray-300 rounded-md bg-white cursor-pointer hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all duration-200 flex items-center justify-between"
                    onClick={() => {
                      // Foca no input de data para abrir o calendário
                      if (dateInputRef.current) {
                        dateInputRef.current.showPicker()
                      }
                    }}
                  >
                    <span className={`${date ? 'text-gray-900' : 'text-gray-500'}`}>
                      {formatDateForDisplay(date)}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>

                  {/* Input de data real (oculto) */}
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={date}
                    onChange={handleDateChange}
                    min={getMinDate()}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: 1, pointerEvents: 'none' }}
                  />

                  {/* Indicador visual quando focado */}
                  {showDatePicker && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-2 z-20">
                      <div className="text-sm text-gray-600 text-center">
                        Clique no ícone do calendário para selecionar a data
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Search Button */}
              <div className="pt-4">
                <Button
                  onClick={handleSearch}
                  className="w-full md:w-auto px-12 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 h-14 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-60 cursor-pointer"
                  disabled={!origin || !destination || origin.trim() === destination.trim()}
                >
                  <img src="/src/assets/icons/lupaIcon.svg" alt="Buscar" className="w-5 h-5 mr-2 transition-transform duration-300 group-hover:rotate-12" />
                  Pesquisar Melhores Preços
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      {showResults && (
        <section className="max-w-5xl mx-auto px-4 space-y-8 pb-16">
          {/* Cabeçalho com origem, avião e destino */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 text-gray-700">
              <span className="font-medium">{origin}</span>
              <span className="w-16 h-px bg-gray-300" />
              <img src={AviaoIcon} alt="Avião" className="w-4 h-4" />
              <span className="w-16 h-px bg-gray-300" />
              <span className="font-medium">{destination}</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Resultados para {formatDateForDisplay(date)}</p>
          </div>

          {/* Data Selecionada */}
          <Card className="border border-[#7BFFF0] shadow-lg bg-white grid gap-7">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <img src={DataSelecionadaIcon} alt="Data Selecionada" />
                <CardTitle className="text-3xl md:text-3xl font-bold">Data Selecionada</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col lg:flex-row items-start lg:items-start justify-between gap-6">
                {/* Informações da Data e Preço + Aviso */}
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-gray-800 text-lg font-semibold">{formatDateForDisplay(date)}</p>
                    <div className="flex items-center gap-[5px]">
                      <div className={`w-6 h-6 rounded-full ${getPriceIndicator(2000).color} shadow-sm`}></div>
                      <p className="text-3xl font-bold text-gray-900">R$ 2.000</p>
                    </div>
                  </div>

                  {/* Aviso e Recomendação abaixo do preço */}
                  <div className="mt-7">
                    <p className="text-[#949494] text-sm">Status do preço:</p>
                    <div className="flex items-center gap-1 justify-items-center">
                      <img src={AvisoIcon} alt="Icone de aviso" />
                      <p className="text-[#ebb70c] text-xl text-nowrap">Preço razoável. Considere as datas alternativas abaixo</p>
                    </div>
                  </div>

                </div>

              </div>
            </CardContent>
          </Card>

          {/* Datas Alternativas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-md border border-[#7BFFF0] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <img src={GraficoDescrecenteIcon} alt="Melhor Data Anterior" className="w-6 h-6" />
                  <h3 className="font-medium text-gray-900 text-xl">Melhor Data Anterior</h3>
                </div>
                <p className="text-sm text-gray-500 mt-2">quarta-feira, 10 de setembro de 2025</p>
                <p className="text-3xl font-semibold text-green-600">R$ 1.400</p>
                <div className="flex items-center justify-items-center gap-1">
                  <img src={SacoDinheiroIcon} alt="" />
                  <p className="text-green-600 text-xl">Economia de R$ 600</p>
                </div>

              </CardContent>
            </Card>
            <Card className="shadow-md border border-[#7BFFF0] bg-white">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-6">
                  <img src={GraficoDescrecenteIcon} alt="Melhor Data Posterior" className="w-6 h-6" />
                  <h3 className="font-medium text-gray-900 text-xl">Melhor Data Posterior</h3>
                </div>
                <p className="text-sm text-gray-500 mt-2">sexta-feira, 19 de setembro de 2025</p>
                <p className="text-3xl font-semibold text-green-600">R$ 1.500</p>
                <div className="flex items-center justify-items-center gap-1">
                  <img src={SacoDinheiroIcon} alt="" />
                  <p className="text-green-600 text-xl">Economia de R$ 700</p>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Gráfico */}
          <Card className="bg-white border-[#7BFFF0]">
            <CardHeader>
              <CardTitle className="text-gray-800 text-xl">📈  Variação de Preços - Próximos 15 dias</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  )
}

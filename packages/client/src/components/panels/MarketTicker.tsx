import { useStockPrices, useCryptoPrices } from '../../hooks/useMarketData'

export function MarketTicker() {
  const stocks = useStockPrices()
  const crypto = useCryptoPrices()

  return (
    <div className="absolute top-14 right-4 w-64 max-h-[calc(100vh-120px)] overflow-y-auto pointer-events-auto">
      {/* Stocks */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-lg p-3 mb-2">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
          Markets
        </h3>
        <div className="space-y-1">
          {stocks.map((stock) => (
            <div key={stock.symbol} className="flex justify-between items-center text-xs">
              <span className="font-mono text-slate-300 w-12">{stock.symbol}</span>
              <span className="font-mono text-white">
                {stock.price.toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
              <span
                className={`font-mono w-14 text-right ${
                  stock.change >= 0 ? 'text-econ-green' : 'text-econ-red'
                }`}
              >
                {stock.change >= 0 ? '+' : ''}
                {stock.change.toFixed(2)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Crypto */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-lg p-3">
        <h3 className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2">
          Crypto
        </h3>
        <div className="space-y-1">
          {crypto.map((coin) => (
            <div key={coin.id} className="flex justify-between items-center text-xs">
              <span className="font-mono text-slate-300 w-10">{coin.symbol}</span>
              <span className="font-mono text-white">
                {coin.price >= 1000
                  ? `$${coin.price.toLocaleString()}`
                  : `$${coin.price.toFixed(2)}`}
              </span>
              <span
                className={`font-mono w-14 text-right ${
                  coin.change24h >= 0 ? 'text-econ-green' : 'text-econ-red'
                }`}
              >
                {coin.change24h >= 0 ? '+' : ''}
                {coin.change24h.toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

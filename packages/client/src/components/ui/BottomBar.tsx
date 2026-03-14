import { YieldCurve } from '../panels/YieldCurve'

export function BottomBar() {
  return (
    <div className="absolute bottom-4 left-4 pointer-events-auto">
      <YieldCurve />
    </div>
  )
}

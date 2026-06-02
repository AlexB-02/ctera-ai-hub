export function WorldMap() {
  return (
    <div className="w-full h-full relative">
      <img
        src="/images/world-map-simple.png"
        alt="World Map"
        className="w-full h-full object-cover"
        draggable={false}
      />
    </div>
  )
}

import { getLength } from 'ol/sphere'

const meterFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 2, style: 'unit', unit: 'meter' })
const kilometerFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, { maximumFractionDigits: 2, style: 'unit', unit: 'kilometer' })
const angleFormatter = new Intl.NumberFormat(window.navigator.userLanguage || window.navigator.language, {
  maximumFractionDigits: 2
})

const formatLength = length => {
  if (length < 1000) {
    return meterFormatter.format(length)
  }
  return kilometerFormatter.format(length / 1000)
}

export const formatAngle = angle => {
  return `${angleFormatter.format(angle)}°`
}

export const length = geometry => {
  return formatLength(getLength(geometry))
}

export const angle = lineStringSegment => {
  const start = lineStringSegment.getFirstCoordinate()
  const end = lineStringSegment.getLastCoordinate()
  return formatAngle((-1 * Math.atan2(end[1] - start[1], end[0] - start[0]) * 180 / Math.PI + 450) % 360)
}


export const getLastSegmentCoordinates = lineStringGeometry => {
  const coordinates = lineStringGeometry.getCoordinates()
  if (coordinates.length <= 2) return coordinates
  return [coordinates[coordinates.length - 2], coordinates[coordinates.length - 1]]
}

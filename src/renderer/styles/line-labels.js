import * as R from 'ramda'
import { Point, Stroke, Style, Text } from './predef'
import { defaultFont } from './font'

const { PI: _PI } = Math
const _TWO_PI = 2 * _PI
const _HALF_PI = _PI / 2
const vector = points => [points[1][1] - points[0][1], points[1][0] - points[0][0]]
const atan2 = delta => -1 * Math.atan2(delta[0], delta[1])
const normalizeAngle = x => x < 0 ? _TWO_PI + x : x
const segmentAngle = R.compose(normalizeAngle, atan2, vector)
const head = xs => xs[0]
const last = xs => xs[xs.length - 1]

export default lines => feature => {
  const points = feature.getGeometry().getCoordinates()
  const segments = R.aperture(2, points)

  const α1 = segmentAngle(head(segments))
  const αn = segmentAngle(last(segments))
  const flip = α => α > _HALF_PI && α < 3 * _HALF_PI
  const xOffset = 20

  const text = lines(feature.getProperties()).join('\n')

  return [
    Style.of({
      geometry: Point.of(head(points)),
      text: Text.of({
        text,
        font: defaultFont(),
        stroke: Stroke.of({ color: 'white', width: 3 }),
        rotation: flip(α1) ? α1 - _PI : α1,
        textAlign: flip(α1) ? 'end' : 'start',
        offsetX: flip(α1) ? xOffset : -xOffset
      })
    }),
    Style.of({
      geometry: Point.of(last(points)),
      text: Text.of({
        text,
        font: defaultFont(),
        stroke: Stroke.of({ color: 'white', width: 3 }),
        rotation: flip(αn) ? αn - _PI : αn,
        textAlign: flip(αn) ? 'start' : 'end',
        offsetX: flip(αn) ? -xOffset : xOffset
      })
    })
  ]
}
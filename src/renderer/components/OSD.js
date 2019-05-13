import React from 'react'
import { withStyles } from '@material-ui/core/styles'
import { currentDateTime } from '../../shared/datetime'

// OSD slots: Prepare styles for 3 columns x 3 rows.
const osdSlots = () => {
  const columns = {
    "A": { justifySelf: 'start' },
    "B": { justifySelf: 'center' },
    "C": { justifySelf: 'end' }
  }

  return ['1', '2', '3'].reduce((acc, name) => {
    return Object.entries(columns).reduce((acc, [key, value]) => {
      acc[`osd${key}${name}`] = {
        gridArea: `${key}${name}`,
        justifySelf: value.justifySelf,
        background: 'rgba(250, 250, 250, 0.6)'
      }
      return acc
    }, acc)
  }, {})
}

const styles = Object.assign({
  osdPanel: {
    fontFamily: 'Roboto, sans-serif',
    fontSize: '120%',
    userSelect: 'none',
    gridRowStart: 1,
    gridColumnStart: 1,
    display: 'grid',
    gridTemplateColumns: '1fr auto 1fr',
    gridTemplateRows: 'repeat(3, 1fr)',
    gridTemplateAreas: `
      "A1 B1 C1"
      "A2 B2 C2"
      "A3 B3 C3"
    `
  }
}, osdSlots())


class OSD extends React.Component {

  constructor(props) {
    super(props)

    this.state = {
      C1: currentDateTime()
    }
  }

  componentDidMount() {
    this.clockInterval = setInterval(() => {
      this.setState({ ...this.state, C1: currentDateTime() })
    }, 1000)
  }

  render() {
    const slots = ['1', '2', '3'].reduce((acc, row) => {
      return ['A', 'B', 'C'].reduce((acc, column) => {
        const key = `${column}${row}`
        return acc.concat(
          <div key={ key } className={ this.props.classes[`osd${key}`] }>{ this.state[key] }</div>
        )
      }, acc)
    }, [])

    return <div className={ this.props.classes.osdPanel }>{ slots }</div>
  }
}

export default withStyles(styles)(OSD)
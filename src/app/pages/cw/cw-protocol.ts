export function standardCq(callsign: string): string {
    return `CQ CQ DE ${callsign} ${callsign}\nCQ CQ DE ${callsign} ${callsign} K`;
}

export function standardExchange(recipient: string, sender: string, rst: string, qth: string, operator: string): string {
    return `${recipient} DE ${sender} R RST ${rst} BT\nQTH ${qth} BT\nOP ${operator} ${recipient} DE ${sender} KN`;
}

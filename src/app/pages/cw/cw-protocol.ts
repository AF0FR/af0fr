export function standardCq(callsign: string): string {
    return `CQ CQ DE ${callsign} ${callsign}\nCQ CQ DE ${callsign} ${callsign} K`;
}

export function standardExchange(recipient: string, sender: string, rst: string, qth: string, operator: string): string {
    return `${recipient} DE ${sender}\nGM/GA/GE TNX FER CALL BT\nUR RST ${rst} BT\nQTH ${qth} BT\nNAME ${operator} BT HW? BK`;
}

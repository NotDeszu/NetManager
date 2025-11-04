#!/bin/sh

# Generate snmpd.conf from environment variables
cat > /etc/snmp/snmpd.conf <<EOF
# Standard read-only community string
rocommunity ${SNMP_COMMUNITY:-public}

# System contact and location information
syscontact ${SNMP_CONTACT:-YourName}
syslocation ${SNMP_LOCATION:-Docker}

# --- ADD THESE LINES TO ENABLE MORE METRICS ---
# Monitor disk space for the root partition (/)
disk /

# Monitor system load average (1, 5, and 15 minute averages)
# This provides the data for the processor health graph.
load 12 14 14
# --- END OF NEW LINES ---
EOF

# Handle MIB_MODULES (unchanged)
if [ -z "$MIB_MODULES" ]; then
  MIB_FLAG="-m ALL"
else
  MIB_FLAG="-m $MIB_MODULES"
fi

# Run snmpd in foreground (unchanged)
exec snmpd -f -Lsd $MIB_FLAG
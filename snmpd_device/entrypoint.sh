#!/bin/sh
# Generate snmpd.conf from environment variables
cat > /etc/snmp/snmpd.conf <<EOF
rocommunity ${SNMP_COMMUNITY:-public}
syscontact ${SNMP_CONTACT:-YourName}
syslocation ${SNMP_LOCATION:-Docker}
EOF

# Handle MIB_MODULES: blank or unset means load all
if [ -z "$MIB_MODULES" ]; then
  MIB_FLAG="-m ALL"
else
  MIB_FLAG="-m $MIB_MODULES"
fi

# Run snmpd in foreground with logging to stderr (good for Docker)
exec snmpd -f -Lsd $MIB_FLAG
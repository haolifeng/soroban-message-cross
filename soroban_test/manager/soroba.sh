#!/bin/bash
RPC="https://rpc.mainnet.noble.strange.love:443"
NUM=50
NODENUM=3
LOG="_m_noble.log"

for ((i=1;i<=$NODENUM;i++))
do
      	echo "$i$LOG";
  node ./soroban_tx.js $RPC $NUM  $i$LOG &
done



# scamp



## Connection Topologies

Scamp allows you to choose your connection topology by providing a range of pluggable connection and channel sources. For example...


#### Dedicated connection with a dedicated channel
      ┌─────────────────────────┐                                            ┌─────────────────────────┐
      │                         │                 Connection                 │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │        Producer         ╠══════════════════Channel═══════════════════╣          VHost          │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         │                                            │                         │
      └─────────────────────────┘                                            └─────────────────────────┘


#### Dedicated connection with a channel pool
      ┌─────────────────────────┐                                            ┌─────────────────────────┐
      │                         │                 Connection                 │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         ╠═════════════════Channel 1══════════════════╣                         │
      │                         │                                            │                         │
      │        Producer         │                                            │          VHost          │
      │                         │                                            │                         │
      │                         ╠═════════════════Channel 2══════════════════╣                         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      └─────────────────────────┘                                            └─────────────────────────┘



#### Connection pool with dedicated channels
      ┌─────────────────────────┐                Connection 1                ┌─────────────────────────┐
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         ╠════════════════Channel 1═══════════════════╣                         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │        Producer         │                                            │          VHost          │
      │                         │                Connection 2                │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                                            │                         │
      │                         ╠═════════════════Channel 2══════════════════╣                         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      └─────────────────────────┘                                            └─────────────────────────┘

#### Dedicated active/passive connection with dedicated channel

      ┌─────────────────────────┐                Connection 1                ┌─────────────────────────┐
      │                         ├────────────────────────────────────────────┤                         │
      │                         │                 Channel 1                  │                         │
      │                         ╠════════════════════════════════════════════╣         VHost 1         │
      │                         │                                            │                         │
      │                         ├────────────────────────────────────────────┤                         │
      │        Producer         │                                            └─────────────────────────┘
      │                         │           Connection 2 (passive)           ┌─────────────────────────┐
      │                         ├ ─ ─ ─ ─ ─  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │                         │
      │                         │                                            │                         │
      │                         ├ ─ ─ ─ ─ ─ ─ Channel 2 (passive) ─ ─ ─ ─ ─ ─│         VHost 2         │
      │                         │                                            │                         │
      │                         ├ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│                         │
      └─────────────────────────┘                                            └─────────────────────────┘

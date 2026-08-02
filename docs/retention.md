# Data retention schedule

| Data                                | Reference-system behavior                           | Production gate                                    |
| ----------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| accepted proposal and public result | retained for accountability                         | published archival policy                          |
| unpublished rejected draft          | synthetic only                                      | short appeal window, then deletion                 |
| voice recording                     | not implemented or retained                         | ephemeral self-hosted transcription                |
| AI draft                            | process memory only                                 | zero-retention agreement or self-hosting           |
| plaintext phone                     | request memory only                                 | processor-confirmed deletion behavior              |
| keyed phone digest                  | five-minute challenge; ten-minute start-rate window | independently reviewed rate window/key destruction |
| raw IP                              | infrastructure may see locally; app does not store  | OHTTP and operator-specific no-retention controls  |
| admin audit event                   | retained                                            | legal and security retention schedule              |
| push subscription                   | encrypted until unsubscribe or browser expiry       | scheduled pruning and published maximum period     |

Backups must not silently extend a promised deletion period. Restore exercises include deletion verification.

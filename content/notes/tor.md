---
title: Tor
tags:
  - notes
  - cryptography
date: 2024-08-23
---
## Etymology

### Onion Routing
At the heart of Tor is onion routing. To achieve privacy, messages are encrypted in multiple layers, much like those of an onion. When this onionized message traverses the network, each intermediary router peels off one layer at a time then forwards the result to the next router, until the final router extracts the core (the original message) which it transfers to the destination.
### Tor
Before Tor became known as such, it was a nameless implementation of onion routing. Similar projects started sprouting up, so the original was named ***The** Onion Routing* to separate it from the rest[^history]. Despite Tor's name stemming from an abbreviation, it is capitalized as *Tor* (**not** TOR).
## My (Totally Real And True) Conspiracy Theory
> [!note] 
> Skip this section if you want to learn something

I think (it would be really funny if) Tor and onion routing as a whole were inspired by *Shrek*. Here's why:
1. Shrek, as a character, is a recluse who seeks privacy in the comfort of his swamp; however, he is oft disturbed by a deluge of visiting villagers and inscrutable squatters. Parallels between his character and that of those who seek privacy online are obvious. 
2. Shrek famously stated: "Ogres are like onions. [...] We both have layers" [^shrekquote]. It is here that privacy and onions form an association, potentially sparking the idea of onion routing in the minds of its creators. 
3. The timelines add up: *Shrek* the picture book (1990) predates onion routing (1995) [^history] by five years, while *Shrek* the movie (2001) premiered one year before the deployment of Tor (2002) [^history]. 
## Terminology
- *Circuit*: A path through the Tor network
- *Relay*: A node in a circuit
	- *Entry*: The first relay in a circuit
		- *Guard*: A small set of trusted entry relays used by a client for a fixed period of time (unless using a bridge)
		- *Bridge*: A relay that is not publicly listed (and can thus act as an entry without being identified as such)
	- *Exit*: The last relay in a circuit 
- *Relay Cell*: The encrypted message at a specific relay
	- *Create Cell*: A cell for creating a circuit, contains the first half of a Diffie-Hellman handshake
	- *Extend Cell*: A cell for extending a circuit; similar to a *create cell* but also contains the address of the relay to extend to
- *Onion Key*: A public decryption key held by every relay
- *Onion Sites/Services*: Sites/services only available via the Tor network
## Background
### A Note On Notation
For the sake of this example, I will use a simplified model of the cell structure defined in [^oldspec]:

> | `Circuit ID` | `Command` | `Body` |

For clarity, commands will be referred to by their identifiers [^commandspec] rather than their true values.
### Constructing A Circuit
Suppose Alice wants to create a circuit. 

First, she chooses an exit node, followed by a chain of relays that constitute a path [^circuitspec] such that no path constraints are violated [^constraints]. By doing so, she will have obtained the onion keys and addresses of each relay on the path. For $n$ relays, let $\set{{k_{relay_1}, k_{relay_2}, \dots, k_{relay_n}}}$ be the keys for each relay. 

Second, Alice establishes a TLS connection with the entry. Then she creates a *relay create cell* with a unique circuit ID ($c_1$) created according to [^circuitIDspec] and as the payload, the first half of a Diffie-Hellman handshake ($g^X$) encrypted using a public key encryption function $E(\cdot)$ with the first relay's onion key (i.e. $E_{k_{relay_1}}(g^X)$). This cell is as follows:

> | $c_1$ | `CREATE` | $E_{k_{relay_1}}(g^X)$ |

Alice sends the cell to the first relay over the TLS channel. The relay decrypts the payload using the corresponding decryption function $D(\cdot)$, and responds with its half of the key ($g^Y$), as well as a hash of the shared key ($H(g^{XY})$) where $H(\cdot)$ is a cryptographic hash function. This cell is constructed like so:

> | $c_1$ | `CREATED` | $g^Y$, $H(g^{XY})$ |

Once Alice receives the response, both parties will have established the shared key $k_1 = g^{XY}$. Henceforth, the circuit ID and shared key is used for all communications between Alice and relay 1. 

To extend the circuit, Alice creates a *relay extend cell* using the same circuit ID, but with a new handshake part ($g^{X_2}$), encrypted with the second relay's onion key. 

> | $c_1$ | `EXTEND`  | $E_{k_{relay_2}}(g^{X_2})$ |

Alice sends the new cell to the first relay. Relay 1, seeing the cell is an *extend* cell, copies the payload directly into a *relay create cell*, but replaces the circuit ID with a new one ($c_2$) before sending the cell to relay 2: 

> | $c_2$ | `CREATE` | $E_{k_{relay_2}}(g^{X_2})$ |

Relay 2 responds to relay 1 with its half of the handshake ($g^{Y_2}$) and a hash of the negotiated key ($H(g^{X_2Y_2})$): 

> | $c_2$ | `CREATED` | $g^{Y_2}$, $H(g^{X_2Y_2})$ |

Relay 1 then copies the payload into a new cell with the original circuit ID, and sends it to Alice:

> | $c_1$ | `EXTENDED` | $E_{k_{relay_1}}(g^X)$) |

Now Alice has negotiated a shared key $k_2 = g^{X_2Y_2}$ with relay 2 such that relay 1 cannot discover the key. 

This process then repeats for all other relays to be added to the circuit. Circuits typically consist of at least three relays, while many onion services use six [^oldspec].
#### Summary

| Step Number | Adding Relay 1                                           | Adding Relay 2                                                    | ... | Adding Relay n                                                                            |
| ----------- | -------------------------------------------------------- | ----------------------------------------------------------------- | --- | ----------------------------------------------------------------------------------------- |
| 1           | Alice -> $relay_1$:<br><br>$(c_1, E_{k_{relay_1}}(g^X))$ | Alice -> $relay_1$:<br><br>$(c_1, E_{k_{relay_2}(g^{X_2})})$      | ... | Alice -> $relay_1$: <br><br>$(c_1, E_{k_{relay_n}(g^{X_n})})$                             |
| 2           | $relay_1$ -> Alice: <br><br>$(c_1, g^Y, H(g^{XY}))$      | $relay_1$ -> $relay_2$: <br><br>$(c_2, E_{k_{relay_2}(g^{X_2})})$ | ... | $relay_1$ -> $relay_2$: <br><br>$(c_2, E_{k_{relay_2}(g^{X_2})})$                         |
| 3           |                                                          | $relay_2$ -> $relay_1$: <br><br>$(c_2, g^{Y_2}, H(g^{X_2Y_2})$    | ... | $relay_2$ -> $relay_3$: <br><br>$(c_3, E_{k_{relay_3}(g^{X_3})})$                         |
| 4           |                                                          | $relay_1$ -> Alice: <br><br>$(c_1, g^{Y_2}, H(g^{X_2Y_2})$        | ... | $relay_3$ -> $relay_4$: <br><br>$(c_4, E_{k_{relay_4}(g^{X_4})})$                         |
| ...         |                                                          |                                                                   | ... | ...                                                                                       |
| n-1         |                                                          |                                                                   |     | $relay_{(n-2)}$ -> $relay_{(n-1)}$: <br><br>$(c_{n-1}, E_{k_{relay_{n-1}}(g^{X_{n-1}})})$ |
| n           |                                                          |                                                                   |     | $relay_{(n-1)}$ -> $relay_n$: <br><br>$(c_n, E_{k_{relay_n}(g^{X_n})})$                   |
| n+1         |                                                          |                                                                   |     | $relay_n$ -> $relay_{(n-1)}$: <br><br>$(c_n, g^{Y_n}, H(g^{X_nY_n})$                      |
| ...         |                                                          |                                                                   |     | ...                                                                                       |
| 2n          |                                                          |                                                                   |     | $relay_1$ -> Alice: <br><br>$(c_1, g^{Y_n}, H(g^{X_nY_n})$                                |
### Using A Circuit
Suppose Alice now has a complete circuit, and thus the keys $\set{k_1, k_2, \dots, k_n}$ with all $n$ relays. To send a message $M$ through the circuit, she creates a relay cell, $C$, like so:

> $C = E_{k_1, k_2, \dots, k_n}(M) = E_{k_1}(E_{k_2}(\dots(E_{k_n}(M))))$ 

and sends it to the entry. The entry peels the first layer, illustrated as follows:

> $C_1 = D_{k_1}(C) = D_{k_1}(E_{k_1, k_2, \dots, k_n}(M)) = \cancel{D_{k_1}}(\cancel{E_{k_1}}(E_{k_2}(\dots(E_{k_n}(M))))) = E_{k_2}(\dots(E_{k_n}(M))) = E_{k_2, \dots, k_n}(M)$

The entry then sets $C_1$'s origin to itself, then sends $C_1$ to relay 2. Relays $2, \dots, n-1$ repeat the same process. Relay $n$, the exit, finally peels $C_n = D_{k_n}(E_{k_n}(M)) = M$, and sends $M$ to the destination.

> [!note] Note
> Almost all traffic these days is TLS-encrypted[^httpsadoption], so the exit does not actually see $M$ itself, but instead, $E_{k_{TLS}}(M)$. The only information the exit knows is the message's destination, which is necessary for forwarding the message.

Throughout this process, relay $i$ only knows of relays $i-1$ and $i+1$, hence only the entry knows the sender and only the exit knows the receiver.
### Summary
The process of constructing and using a two-hop circuit is visualized in [^oldspec] as follows:

![[sequence_diagram.png]]
## Attacks
De-anonymization is an obvious attack on an anonymization network. 

Per the construction above, key recovery means breaking Diffie-Hellman (and thus the discrete log problem), and meaningful inter-relay man-in-the-middle attacks require breaking secure cryptosystems; both of which are infeasible. Hence, most de-anonymization techniques focus on weaker links: the traffic before the entry and after the exit, or human error.
### 1. Traffic Correlation
> If an attacker controls a circuit (i.e. controls both entry and exit on the same circuit), they can see both the source and destination of the message. 
#### Circuit Confirmation Attack
Since the relays themselves will not know which circuits they are a part of, an attacker will first have to confirm that both the entry and exit node under their control are part of the same circuit. One way for them to do this is by perturbing packets at the entry in some predictable way, then observing the same pattern at the exit node. 
#### Correlating Traffic
Once an attacker has confirmed their control over a circuit, they must correlate traffic entering the entry relay and exiting the exit relay. This can be achieved via timing attacks or traffic analysis.
### 2. Website Fingerprinting
> A set of methods to uniquely identify destination websites based on metadata and/or patterns in communication traffic observed between the client and entry relay. Packet sequences, lengths, order, timing information, and other seemingly innocuous features can uniquely identify a site.
#### Examples
- kNN[^knn] (k-nearest neighbours): Leverages features extracted from packet sequences to distinguish web pages
- CUMUL[^cumul] (CUMULative representation): Support vector machine (SVM) using cumulated packet size to represent load behaviour
- kFP[^kfp] (k-nearest neighbours Finger Printing): Random forests and kNN trained on fingerprints of clearnet traffic between specific web pages in order to classify encrypted traffic
- DF[^df] (Deep Fingerprint): A high-precision deep Convolutional Neural Network (CNN) classifier
### 3. Browser Fingerprinting
> A method to uniquely identify a user based on their browser and device setup; ex. OS, graphics card, screen dimensions, language, order of fonts installed, HTTP headers, time zone, browser plugins can identify users with 99% accuracy in some cases[^fingerprintaccuracy].

> [!note] Note
> Even if the client makes small changes (installing new fonts, moving time zone, etc.), they are still highly identifiable
### 4. Canvas Fingerprinting
> A method to uniquely identify a user by asking them (their browser, that is) to draw an image on a canvas (hidden in the DOM), then retrieves that image.

> [!note] Note
> This is **VERY** unique across different computers (anti-aliasing, how they draw colours, etc.)
## Defences
### 1. Traffic Correlation
Use guard nodes, do not choose the same router twice for the same path, do not choose any router in the same family as another router in the same path, do not choose more than one router in a given network range[^constraints]
### 2. Website Fingerprinting
Website fingerprinting is an active research topic within the Tor community and many defences have been presented over the years, thus there are more than I can conceivably compile here. Instead, I'll include some techniques that I came across, categorized into two main classes: *Randomization* and *Regularization*. Others will be placed into an *Other* category.
#### 1. Randomization
> These defences use randomness such that no two traces from the same webpage have the same pattern.
- Adaptive padding[^ad]: introduce dummy packets into traffic to mask traffic bursts and their corresponding features
- WTF-PAD[^wtfpad] (Website Traffic Fingerprinting Protection with Adaptive Defence): a generalization of adaptive padding
- FRONT[^front]: randomize the shape of distributions used for sampling the timing and number of dummy packets added, and place dummy packets near the front of a trace
#### 2. Regularization
> These defences fit traces into deterministic patterns. That is, traces from different pages become indistinguishable.
- Padding: pad packets such that all have equal size (ex. by making all packets the maximum size)
- BuFLO[^buflo] (Buffered Fixed-Length Obfuscation): send packets of a fixed size at fixed intervals, using dummy packets to both fill in and (potentially) extend the transmission
- Walkie-Talkie[^walkietalkie]: transform packet sequences of monitored sensitive pages and benign non-sensitive pages such that the packet sequences are identical (in terms of timing, length, direction, and ordering)
- Tamaraw[^tamaraw]: an extension of BuFLO which sets packet size at 750 bytes rather than the MTU, and treats input and outgoing traffic differently (i.e. outgoing fixed at higher interval)
#### 3. Other
- Traffic morphing[^trafficmorphing]: load a web page using a packet size distribution from a different page
- Decoy pages[^decoypages]: load a decoy page simultaneously with the real page to hide the real packet sequence
- TrafficSilver[^trafficsilver]: split traffic over several "sub-circuits" (i.e. circuits containing distinct entry nodes) in a random manner
- Surakav[^surakav]: train a generator that is able to generate various reference traces, then sample reference traces from the trained generator and send bursts of data based on the reference trace
### 3. Browser Fingerprinting
Give standardized answers for everything (implemented in Tor Browser). For example, always return 1920x1080 for the screen size, UTC for the time zone, and Comic Sans as the only font (jk), etc.
### 4. Canvas Fingerprinting
Disable canvassing (implemented in Tor Browser)

[^history]: https://www.torproject.org/about/history/
[^shrekquote]: https://www.quotes.net/mquote/85881
[^oldspec]: https://svn-archive.torproject.org/svn/projects/design-paper/tor-design.html#subsec:circuits
[^commandspec]: https://spec.torproject.org/tor-spec/cell-packet-format.html#command
[^circuitspec]: https://spec.torproject.org/tor-spec/creating-circuits.html
[^circuitIDspec]: https://spec.torproject.org/tor-spec/create-created-cells.html#choosing-circid
[^httpsadoption]: https://radar.cloudflare.com/adoption-and-usage#http-vs-https
[^knn]: https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/wang_tao
[^cumul]: https://doi.org/10.14722/ndss.2016.23477
[^kfp]: https://doi.org/10.48550/arXiv.1509.00789
[^df]: https://doi.org/10.48550/arXiv.1801.02265
[^fingerprintaccuracy]: https://arstechnica.com/information-technology/2017/02/now-sites-can-fingerprint-you-online-even-when-you-use-multiple-browsers/
[^constraints]: https://spec.torproject.org/path-spec/path-selection-constraints.html
[^ad]: https://www.cs.utexas.edu/~shmat/shmat_esorics06.pdf
[^wtfpad]: https://arxiv.org/abs/1512.00524
[^front]: https://dl.acm.org/doi/pdf/10.5555/3489212.3489253
[^buflo]: https://ieeexplore.ieee.org/document/6234422
[^walkietalkie]: https://www.usenix.org/system/files/conference/usenixsecurity17/sec17-wang-tao.pdf
[^tamaraw]: https://www.cs.sfu.ca/~taowang/wf/Ca-Tamaraw.pdf
[^trafficmorphing]: https://www.ndss-symposium.org/wp-content/uploads/2017/09/wright.pdf
[^decoypages]: https://www.freehaven.net/anonbib/cache/wpes11-panchenko.pdf
[^trafficsilver]: https://www.comsys.rwth-aachen.de/fileadmin/papers/2020/2020-delacadena-trafficsliver.pdf
[^surakav]: https://ieeexplore.ieee.org/document/9833722

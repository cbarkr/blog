---
title: tor
tags:
  - note
date: 2024-08-23
---
## Etymology
### Tor
Tor (note the capitalization) was *originally* an abbreviation for *The Onion Routing*[^history] (**not** *The Onion Rout**er***). After the original project's conception, similar projects sprouted up, so the original was named *The* Onion Routing to cement its place[^history].
### Onion
Like layers of an onion, onion routing networks encrypt messages in multiple layers. When this onionized message passes through the network, each intermediary router peels off one layer that only they can peel, before passing it off to the next router to do the same with the next layer. 
## Terminology
- *Circuit*: A path through the Tor network
- *Relay*: A node in a circuit
	- *Entry*: The first relay in a circuit
	- *Guard*: A small set of entry relays used by a client for a certain amount of time (unless using a bridge)
	- *Exit*: The last relay in a circuit 
- *Bridge*: A relay that is not publicly available (and can thus act as an entry without being identified as such)
- *Relay Cell*: The encrypted message at a specific relay
	- *Create Cell*: A cell for creating a circuit, contains the first half of a Diffie-Hellman handshake
	- *Extend Cell*: A cell for extending a circuit; similar to a *create cell* but also contains the address of the relay to extend to
- *Onion Key*: A public decryption key held by every relay
- *Onion Sites/Services*: Sites/services only available via the Tor network
## Background
> See [^spec] for more details
### Constructing A Circuit
Suppose Alice wants to create a circuit. First, she obtains the onion keys (public decryption keys held by every relay) and addresses of relays that will form the circuit. For $n$ relays, let $\set{{k_{relay_1}, k_{relay_2}, \dots, k_{relay_n}}}$ be the keys for each relay. 

Then Alice creates a *relay create cell* with a unique circuit ID ($c_1$), containing the first half of a Diffie-Hellman handshake ($g^X$), encrypted using the first relay's onion key, as the payload. Alice sends the cell to the first relay. The relay decrypts the payload, and responds with its half of the key ($g^Y$) and a hash of the shared key ($H(g^{XY})$). When Alice receives the response, both parties will have established the shared key $k_1 = g^{XY}$. Henceforth, the circuit ID and shared key is used for all communications between Alice and relay 1. 

To extend the circuit, Alice creates a *relay extend cell* using the same circuit ID, but with a new handshake part ($g^{X_2}$), encrypted with the second relay's onion key. Alice sends the new cell to the first relay. Relay 1, seeing the cell is an *extend* cell, copies the payload directly into a *relay create cell*, but replaces the circuit ID with a new one ($c_2$) before sending the cell to relay 2. Relay 2 responds to relay 1 with its half of the handshake ($g^{Y_2}$) and a hash of the negotiated key ($H(g^{X_2Y_2})$). Relay 1 then copies the payload into a new cell with the original circuit ID, and sends it to Alice. Now Alice has negotiated a shared key $k_2 = g^{X_2Y_2}$ with relay 2.

This process then repeats for all other relays to be added to the circuit. Circuits typically consist of three relays, while many onion services use six relays[^spec].
#### Summary
##### First Relay

1. Alice -> Relay 1: $(c_1, E_{k_{relay_1}}(g^X))$
2. Relay 1 -> Alice: $(c_1, g^Y, H(g^{XY}))$
##### Second Relay

1. Alice -> Relay 1: $(c_1, E_{k_{relay_2}(g^{X_2})})$
2. Relay 1 -> Relay 2: $(c_2, E_{k_{relay_2}(g^{X_2})})$
3. Relay 2 -> Relay 1: $(c_2, g^{Y_2}, H(g^{X_2Y_2})$
4. Relay 1 -> Alice: $(c_1, g^{Y_2}, H(g^{X_2Y_2})$
##### $n$th Relay
1. Alice -> Relay 1: $(c_1, E_{k_{relay_n}(g^{X_n})})$
2. $\dots$
3. Relay $(n-1)$ -> Relay $n$: $(c_n, E_{k_{relay_n}(g^{X_n})})$
4. Relay $n$ -> Relay $(n-1)$: $(c_n, g^{Y_n}, H(g^{X_nY_n})$
5. $\dots$
6. Relay 1 -> Alice: $(c_1, g^{Y_n}, H(g^{X_nY_n})$
### Using A Circuit
Suppose Alice now has a complete circuit, and thus the keys $\set{k_1, k_2, \dots, k_n}$ with all $n$ relays. To send a message $M$ through the circuit, she creates a relay cell $C = E_{k_1, k_2, \dots, k_n}(M) = E_{k_1}(E_{k_2}(\dots(E_{k_n}(M))))$ and sends it to the entry. The entry peels the first layer like $C_1 = D_{k_1}(C) = D_{k_1}(E_{k_1, k_2, \dots, k_n}(M)) = D_{k_1}(E_{k_1}(E_{k_2}(\dots(E_{k_n}(M))))) = E_{k_2}(\dots(E_{k_n}(M))) = E_{k_2, \dots, k_n}(M)$, sets $C_1$'s origin to itself, then sends $C_1$ to relay 2. Relays $2, \dots, n-1$ repeat the same process. Relay $n$, the exit, finally peels $C_n = D_{k_n}(E_{k_n}(M)) = M$, and sends $M$ to the destination.

> [!note] Note
> Almost all traffic these days is TLS-encrypted[^httpsadoption], so the exit does not actually see $M$ itself, but instead, $E_{k_{TLS}}(M)$. The only information the exit knows is the message's destination, which is necessary for forwarding the message.

Throughout this process, relay $i$ only knows of relays $i-1$ and $i+1$, hence only the entry knows the sender and only the exit knows the receiver.
## Attacks
De-anonymization is an obvious attack on an anonymization network. 

Per the construction above, key recovery means breaking Diffie-Hellman (and thus the discrete log problem), and meaningful inter-relay man-in-the-middle attacks require breaking secure cryptosystems; both of which are infeasible. Hence, most de-anonymization techniques focus on weaker links: the traffic before the entry and after the exit, or human error.
### 1. Traffic Correlation
> If an attacker controls a circuit (i.e. controls both entry and exit on the same circuit), they can see both the source and destination of the message. 
### Circuit Confirmation Attack
Since the relays themselves will not know which circuits they are a part of, an attacker will first have to confirm that both the entry and exit node under their control are part of the same circuit. One way for them to do this is by perturbing packets at the entry in some predictable way, then observing the same pattern at the exit node. 
### Correlating Traffic
Once an attacker has confirmed their control over a circuit, they must correlate traffic entering the entry relay and exiting the exit relay. This can be achieved via timing attacks or traffic analysis.
### 2. Website Fingerprinting
> A set of methods to uniquely identify destination websites based on metadata and/or patterns in communication traffic. Packet sequences, lengths, order, timing information, and other seemingly innocuous features can uniquely identify a site
#### Examples
- kNN[^knn] (k-nearest neighbours): Leverages features extracted from packet sequences to distinguish web pages
- CUMUL[^cumul] (CUMULative representation): Support vector machine (SVM) using cumulated packet size to represent load behaviour
- kFP[^kfp] (k-nearest neighbours Finger Printing): Random forests and kNN trained on fingerprints of clearnet traffic between specific web pages in order to classify encrypted traffic
- DF[^df] (Deep Fingerprint): A high-precision deep Convolutional Neural Network (CNN) classifier
### 3. Browser Fingerprinting
> A method to uniquely identify a user based on their browser and device setup; ex. OS, graphics card, screen dimensions, language, order of fonts installed, HTTP headers, time zone, browser plugins can identify users with 99% accuracy in some cases[^fingerprintaccuracy]

> [!note] Note
> Even if the client makes small changes (installing new fonts, moving time zone, etc.), they are still highly identifiable
### 4. Canvas Fingerprinting
> A method to uniquely identify a user by asking them (their browser, that is) to draw an image on a canvas (hidden in the DOM), then retrieves that image

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
[^spec]: https://svn-archive.torproject.org/svn/projects/design-paper/tor-design.html#subsec:circuits
[^httpsadoption]: https://radar.cloudflare.com/adoption-and-usage#http-vs-https
[^knn]: https://www.usenix.org/conference/usenixsecurity14/technical-sessions/presentation/wang_tao
[^cumul]: https://doi.org/10.14722/ndss.2016.23477
[^kfp]: https://doi.org/10.48550/arXiv.1509.00789
[^df]: https://doi.org/10.48550/arXiv.1801.02265
[^fingerprintaccuracy]: https://arstechnica.com/information-technology/2017/02/now-sites-can-fingerprint-you-online-even-when-you-use-multiple-browsers/
[^constraints]: https://spec.torproject.org/path-spec/path-selection-constraints.html#universal-constraints
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
const KRONBERG_PROMPT = `Du bist der Vorstand der Kronberg Sitzsysteme GmbH, einem Automobilzulieferer mit mehreren Standorten in Europa. Das Unternehmen beschäftigt 1.500 Mitarbeitende und ist spezialisiert auf Gesamtsitzsysteme für Automobilhersteller. Wichtigste Kunden sind AUDI und BMW. Der Jahresumsatz 2024 beträgt 370 Millionen Euro.
Du bist direkt und ergebnisorientiert, aber kein Unmensch. Du willst verstehen, ob das Team grundsätzlich an alles gedacht hat. Das ist ein erstes Orientierungsgespräch, kein Abnahme-Audit.

Die Kronberg Sitzsysteme GmbH steht unter erheblichem wirtschaftlichem Druck. Trotz Umsatzwachstums ist das EBIT von 20 Mio. € auf 13 Mio. € gesunken. Mit Projekt Fokus26 soll das Unternehmen bis 2028 grundlegend transformiert werden.

Strategische Ziele bis 2028: EBIT von 13 auf 26 Mio. €, Materialausbeute-Verlust von 8,5 auf 5 Mio. €, Premiumfrachtkosten von 2,1 auf 0,8 Mio. €, OEM-Strafen von 10 auf 2 Mio. €, Ausfallzeiten von 6,4% auf 3,5%.

Du simulierst ein erstes Orientierungsgespräch mit dem Projektteam Fokus26. Wenn das Gespräch in Finanzzahlen abgleitet, lenkst du zurück.

Pflichtthemen - genau eine Frage pro Nachricht:
- Ausgangslage: Was soll verändert werden?
- Vision: Wo wollen Sie hin?
- Führung: Wie wird sichergestellt dass das nicht nur eine Ansage von oben bleibt?
- Kommunikation: Wie soll die Kommunikation laufen?
- Multiplikatoren: Wer trägt das in die Breite?
- Betriebsrat: Ist der Betriebsrat berücksichtigt?
- Steuerung: Wie ziehen alle Bereiche am gleichen Strang?
- Ressourcen: Intern oder externe Unterstützung?
- Mitarbeitende: Wie holen Sie die Belegschaft mit?
- Tracking: Wie verfolgen Sie den Fortschritt?

Gesprächsregeln: Pro Nachricht genau eine Frage. Direkt reagieren. Kurz bestätigen wenn Thema beantwortet. Bei vagen Antworten einmal nachfragen. Kein Smalltalk. Wie ein Unternehmer sprechen.

Eröffne mit exakt diesem Satz: Sie haben 20 Minuten. Präsentieren Sie mir bitte Ihren Veränderungsprozess zum Projekt Fokus26.

Bewertung am Ende: Freigabe zur Umsetzung / Freigabe unter Auflagen / Nicht freigegeben.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "GEMINI_API_KEY fehlt in Vercel" }, { status: 500 });
    }

    // Chat-Verlauf für Gemini API transformieren
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    }));

    // URL ohne Key im Query-String – behebt Probleme mit dem neuen AQ.-Format
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Hier wird dein AQ.-Key sicher per Header übertragen
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: contents,
        // Übermittlung des System-Prompts als natives API-Feature
        systemInstruction: {
          parts: [{ text: KRONBERG_PROMPT }]
        },
        generationConfig: {
          temperature: 0.7,
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: "Gemini API Fehler: " + (data.error?.message || JSON.stringify(data)) },
        { status: response.status }
      );
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!reply) {
      return Response.json({ error: "Keine Textantwort erhalten" }, { status: 500 });
    }

    return Response.json({ reply });

  } catch (err) {
    return Response.json({ error: "Interner Serverfehler: " + err.message }, { status: 500 });
  }
}

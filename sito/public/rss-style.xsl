<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
  <xsl:template match="/">
    <html lang="it">
      <head>
        <meta charset="UTF-8"/>
        <title><xsl:value-of select="/rss/channel/title"/> - Feed RSS</title>
        <meta name="viewport" content="width=device-width, initial-scale=1"/>
        <style>
          body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; color: #0f172a; }
          h1 { font-size: 1.75rem; }
          .hint { background: #fffbeb; border: 1px solid #fde68a; padding: 1rem; border-radius: 8px; }
          article { border-top: 1px solid #e2e8f0; padding: 1rem 0; }
          a { color: #1e5bc6; }
        </style>
      </head>
      <body>
        <h1><xsl:value-of select="/rss/channel/title"/></h1>
        <p><xsl:value-of select="/rss/channel/description"/></p>
        <div class="hint">
          Stai vedendo un <strong>feed RSS</strong>. Per leggerlo, copia l'URL in un'app come Feedly, NetNewsWire o un client di posta che supporta RSS.
        </div>
        <xsl:for-each select="/rss/channel/item">
          <article>
            <h2><a><xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute><xsl:value-of select="title"/></a></h2>
            <small><xsl:value-of select="pubDate"/></small>
            <p><xsl:value-of select="description"/></p>
          </article>
        </xsl:for-each>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>

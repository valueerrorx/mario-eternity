
# repo auschecken (klonen)
git clone https://github.com/valueerrorx/mario-eternity.git


# alten ordner (aus dem weg räumen) umbenennen
mv mario-eternity mario-bak

# in meinen eigenen branch wechseln
git checkout meinbranch


# branch "main" in den derzeit akitven branch mergen (vereinen)
git merge main


# neue dateien zum index hinzufügen
git add .

# snapshot (commit) erstellen
git commit -am "meine commitmessage"

# änderungen hochladen   (username / token)
git push


# branch erstellen 
git checkout -b neuerbranch

# überprüfen auf welchem zustand das repo ist
git status

# alle branches listen (git pull vorher)
git branch -a
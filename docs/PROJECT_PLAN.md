\# One Piece Card Game (OPCG) Teaching App – Full Implementation Blueprint



\## 1. Project Overview

\*\*Goal:\*\* Rebuild a functional, offline-capable OPCG Teaching App using Unity (WebGL target). 

\*\*Methodology:\*\* We are extracting the visual assets from the official WebGL build (`EN.data`) and writing custom, original C# architecture from scratch based on reverse-engineered patterns. 

\*\*Final Output:\*\* A deployable WebGL folder (`Build/`, `index.html`, `TemplateData/`) that replicates the core OPCG tutorial experience.



\---



\## 2. Asset Extraction \& Preparation (Phase 1)

\*Before writing code, we must retrieve the game's art assets to use in Unity.\*



1\.  Download the official web files from the target URL via Chrome DevTools Network tab.

2\.  Save the `Build/` folder containing `EN.data`, `EN.wasm`, `EN.framework.js`, and `EN.loader.js`.

3\.  Download and run \*\*AssetStudio\*\* (Open Source Unity Extractor).

4\.  Load `EN.data` into AssetStudio and extract:

&#x20;   \*   `Textures/` (Card Artwork, UI Frames, Logos, Buttons).

&#x20;   \*   `AudioClips/` (SE\_Draw, SE\_Attack, SE\_CardPlay, SE\_LifeDamage, etc.).

&#x20;   \*   `Fonts/` (Title and Text fonts).

5\.  \*\*Data Layer:\*\* Create a `.json` file (`CardDatabase.json`) containing a list of OPCG cards (ID, Name, Cost, Power, Counter, Color, Kind) mapped to the extracted art filenames.



\---



\## 3. Project Architecture \& C# Scripts (Phase 2)

\*This is the foundational code to be created in the Unity `Assets/Scripts/` folder.\*



\### 3.1 Data Layer: `CardData` and `CardInstance`

\*\*Location:\*\* `Assets/Scripts/Data/CardData.cs`



```csharp

using UnityEngine;



namespace OPCG.Data

{

&#x20;   public enum CardColor { Red, Green, Blue, Purple, Black, Yellow, Colorless }

&#x20;   public enum CardKind  { Leader, Character, Event, Stage, Don }



&#x20;   \[CreateAssetMenu(fileName = "CardData", menuName = "OPCG/Card Data", order = 0)]

&#x20;   public class CardData : ScriptableObject

&#x20;   {

&#x20;       public string CardId;            // "OP01-001"

&#x20;       public string DisplayName;

&#x20;       public CardKind Kind;

&#x20;       public CardColor\[] Colors;

&#x20;       public int Cost;

&#x20;       public int Power;

&#x20;       public int CounterValue;

&#x20;       public Sprite Artwork;

&#x20;       public Sprite CardBack;

&#x20;   }



&#x20;   public class CardInstance

&#x20;   {

&#x20;       public readonly CardData Data;

&#x20;       public bool IsTapped;

&#x20;       public bool IsFaceDown;

&#x20;       public int AttachedDon;

&#x20;       public int OwnerId;



&#x20;       public CardInstance(CardData data, int ownerId)

&#x20;       {

&#x20;           Data = data;

&#x20;           OwnerId = ownerId;

&#x20;       }

&#x20;   }

}


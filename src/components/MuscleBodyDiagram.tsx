import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { 
  Path, 
  Circle, 
  Ellipse, 
  G,
  Text as SvgText,
  Defs,
  LinearGradient,
  Stop
} from 'react-native-svg';

const { width } = Dimensions.get('window');
const bodyWidth = Math.min(width * 0.42, 180); // Slightly larger for better touch
const bodyHeight = bodyWidth * 2.0;

interface MuscleBodyDiagramProps {
  workedMuscles: string[];
  allMuscles: string[];
  onMusclePress?: (muscle: string) => void;
  view: 'front' | 'back';
}

export default function MuscleBodyDiagram({ workedMuscles, allMuscles, onMusclePress, view }: MuscleBodyDiagramProps) {
  
  const getMuscleColor = (muscle: string): string => {
    const hasWorkedParts = workedMuscles.some(worked => worked.startsWith(muscle + '.'));
    if (hasWorkedParts) {
      return '#FF4444'; // Red for worked muscles
    } else {
      return '#4488FF'; // Blue for unworked muscles
    }
  };

  const getMuscleOpacity = (muscle: string): number => {
    const hasWorkedParts = workedMuscles.some(worked => worked.startsWith(muscle + '.'));
    if (hasWorkedParts) {
      return 0.8; // High opacity for worked muscles
    } else {
      return 0.4; // Lower opacity for unworked muscles
    }
  };

  const handleMusclePress = (muscle: string) => {
    console.log('Muscle pressed:', muscle); // Debug log
    if (onMusclePress) {
      onMusclePress(muscle);
    }
  };

  const renderFrontView = () => (
    <>
      {/* Head */}
      <Circle 
        cx="100" 
        cy="30" 
        r="18" 
        fill="#F5C6A0" 
        stroke="#D4A574" 
        strokeWidth="1"
      />

      {/* Chest - Interactive */}
      <G onPressIn={() => handleMusclePress('chest')} delayPressIn={0}>
        {/* Much larger invisible touch area for easier clicking */}
        <Ellipse 
          cx="100" 
          cy="87" 
          rx="45" 
          ry="40" 
          fill="transparent"
        />
        <Path
          d="M 75 65 Q 100 60 125 65 Q 125 110 100 115 Q 75 110 75 65 Z"
          fill={getMuscleColor('chest')}
          fillOpacity={getMuscleOpacity('chest')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="100" y="90" textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="bold">
          CHEST
        </SvgText>
      </G>

      {/* Front Delts - Interactive */}
      <G onPressIn={() => handleMusclePress('delts')} delayPressIn={0}>
        {/* Larger invisible touch areas */}
        <Ellipse cx="62" cy="75" rx="25" ry="30" fill="transparent" />
        <Ellipse cx="138" cy="75" rx="25" ry="30" fill="transparent" />
        <Ellipse 
          cx="62" 
          cy="75" 
          rx="13" 
          ry="18" 
          fill={getMuscleColor('delts')}
          fillOpacity={getMuscleOpacity('delts')}
          stroke="#333"
          strokeWidth="2"
        />
        <Ellipse 
          cx="138" 
          cy="75" 
          rx="13" 
          ry="18" 
          fill={getMuscleColor('delts')}
          fillOpacity={getMuscleOpacity('delts')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="62" y="80" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          DELT
        </SvgText>
        <SvgText x="138" y="80" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          DELT
        </SvgText>
      </G>

      {/* Biceps - Interactive */}
      <G onPressIn={() => handleMusclePress('biceps')} delayPressIn={0}>
        {/* Much larger invisible touch areas for easier clicking */}
        <Ellipse cx="57" cy="115" rx="28" ry="40" fill="transparent" />
        <Ellipse cx="143" cy="115" rx="28" ry="40" fill="transparent" />
        <Ellipse 
          cx="57" 
          cy="115" 
          rx="9" 
          ry="22" 
          fill={getMuscleColor('biceps')}
          fillOpacity={getMuscleOpacity('biceps')}
          stroke="#333"
          strokeWidth="2"
        />
        <Ellipse 
          cx="143" 
          cy="115" 
          rx="9" 
          ry="22" 
          fill={getMuscleColor('biceps')}
          fillOpacity={getMuscleOpacity('biceps')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="57" y="120" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          BI
        </SvgText>
        <SvgText x="143" y="120" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          BI
        </SvgText>
      </G>

      {/* Abs - Interactive */}
      <G onPressIn={() => handleMusclePress('abs')} delayPressIn={0}>
        {/* Much larger invisible touch area for easier clicking */}
        <Ellipse cx="100" cy="140" rx="40" ry="35" fill="transparent" />
        <Path
          d="M 85 125 Q 100 123 115 125 Q 115 155 100 157 Q 85 155 85 125 Z"
          fill={getMuscleColor('abs')}
          fillOpacity={getMuscleOpacity('abs')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="100" y="145" textAnchor="middle" fontSize="8" fill="#FFF" fontWeight="bold">
          ABS
        </SvgText>
      </G>

      {/* Quads - Interactive */}
      <G onPressIn={() => handleMusclePress('quads')} delayPressIn={0}>
        {/* Larger invisible touch areas */}
        <Ellipse cx="85" cy="210" rx="25" ry="45" fill="transparent" />
        <Ellipse cx="115" cy="210" rx="25" ry="45" fill="transparent" />
        <Ellipse 
          cx="85" 
          cy="210" 
          rx="13" 
          ry="32" 
          fill={getMuscleColor('quads')}
          fillOpacity={getMuscleOpacity('quads')}
          stroke="#333"
          strokeWidth="2"
        />
        <Ellipse 
          cx="115" 
          cy="210" 
          rx="13" 
          ry="32" 
          fill={getMuscleColor('quads')}
          fillOpacity={getMuscleOpacity('quads')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="85" y="215" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          QUAD
        </SvgText>
        <SvgText x="115" y="215" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          QUAD
        </SvgText>
      </G>

      {/* Calves - Interactive */}
      <G onPressIn={() => handleMusclePress('calves')} delayPressIn={0}>
        {/* Much larger invisible touch areas for easier clicking */}
        <Ellipse cx="85" cy="280" rx="22" ry="30" fill="transparent" />
        <Ellipse cx="115" cy="280" rx="22" ry="30" fill="transparent" />
        <Ellipse 
          cx="85" 
          cy="280" 
          rx="10" 
          ry="22" 
          fill={getMuscleColor('calves')}
          fillOpacity={getMuscleOpacity('calves')}
          stroke="#333"
          strokeWidth="2"
        />
        <Ellipse 
          cx="115" 
          cy="280" 
          rx="10" 
          ry="22" 
          fill={getMuscleColor('calves')}
          fillOpacity={getMuscleOpacity('calves')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="85" y="285" textAnchor="middle" fontSize="5" fill="#FFF" fontWeight="bold">
          CALF
        </SvgText>
        <SvgText x="115" y="285" textAnchor="middle" fontSize="5" fill="#FFF" fontWeight="bold">
          CALF
        </SvgText>
      </G>
    </>
  );

  const renderBackView = () => (
    <>
      {/* Head */}
      <Circle 
        cx="100" 
        cy="30" 
        r="18" 
        fill="#F5C6A0" 
        stroke="#D4A574" 
        strokeWidth="1"
      />

      {/* Traps - Interactive */}
      <G onPressIn={() => handleMusclePress('traps')} delayPressIn={0}>
        {/* Much larger invisible touch area for easier clicking */}
        <Ellipse cx="100" cy="65" rx="40" ry="30" fill="transparent" />
        <Path
          d="M 85 55 Q 100 50 115 55 Q 115 75 100 80 Q 85 75 85 55 Z"
          fill={getMuscleColor('traps')}
          fillOpacity={getMuscleOpacity('traps')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="100" y="65" textAnchor="middle" fontSize="7" fill="#FFF" fontWeight="bold">
          TRAPS
        </SvgText>
      </G>

      {/* Lats - Interactive (much clearer positioning) */}
      <G onPressIn={() => handleMusclePress('lats')} delayPressIn={0}>
        {/* Much larger invisible touch areas for easier clicking */}
        <Ellipse cx="78" cy="105" rx="30" ry="40" fill="transparent" />
        <Ellipse cx="122" cy="105" rx="30" ry="40" fill="transparent" />
        <Path
          d="M 75 85 Q 70 105 75 125 Q 82 130 85 115 Q 85 100 75 85 Z"
          fill={getMuscleColor('lats')}
          fillOpacity={getMuscleOpacity('lats')}
          stroke="#333"
          strokeWidth="2"
        />
        <Path
          d="M 125 85 Q 130 105 125 125 Q 118 130 115 115 Q 115 100 125 85 Z"
          fill={getMuscleColor('lats')}
          fillOpacity={getMuscleOpacity('lats')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="78" y="110" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          LAT
        </SvgText>
        <SvgText x="122" y="110" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          LAT
        </SvgText>
      </G>

      {/* Triceps - Interactive */}
      <G onPressIn={() => handleMusclePress('triceps')} delayPressIn={0}>
        {/* Larger invisible touch areas */}
        <Ellipse cx="52" cy="115" rx="20" ry="32" fill="transparent" />
        <Ellipse cx="148" cy="115" rx="20" ry="32" fill="transparent" />
        <Ellipse 
          cx="52" 
          cy="115" 
          rx="8" 
          ry="20" 
          fill={getMuscleColor('triceps')}
          fillOpacity={getMuscleOpacity('triceps')}
          stroke="#333"
          strokeWidth="2"
        />
        <Ellipse 
          cx="148" 
          cy="115" 
          rx="8" 
          ry="20" 
          fill={getMuscleColor('triceps')}
          fillOpacity={getMuscleOpacity('triceps')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="52" y="120" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          TRI
        </SvgText>
        <SvgText x="148" y="120" textAnchor="middle" fontSize="6" fill="#FFF" fontWeight="bold">
          TRI
        </SvgText>
      </G>

      {/* Glutes - Interactive */}
      <G onPressIn={() => handleMusclePress('glutes')} delayPressIn={0}>
        {/* Larger invisible touch area */}
        <Ellipse cx="100" cy="175" rx="30" ry="22" fill="transparent" />
        <Path
          d="M 85 165 Q 100 160 115 165 Q 115 185 100 190 Q 85 185 85 165 Z"
          fill={getMuscleColor('glutes')}
          fillOpacity={getMuscleOpacity('glutes')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="100" y="175" textAnchor="middle" fontSize="7" fill="#FFF" fontWeight="bold">
          GLUTES
        </SvgText>
      </G>

      {/* Hamstrings - Interactive */}
      <G onPressIn={() => handleMusclePress('hamstrings')} delayPressIn={0}>
        {/* Larger invisible touch areas */}
        <Ellipse cx="82" cy="220" rx="18" ry="35" fill="transparent" />
        <Ellipse cx="118" cy="220" rx="18" ry="35" fill="transparent" />
        <Ellipse 
          cx="82" 
          cy="220" 
          rx="10" 
          ry="28" 
          fill={getMuscleColor('hamstrings')}
          fillOpacity={getMuscleOpacity('hamstrings')}
          stroke="#333"
          strokeWidth="2"
        />
        <Ellipse 
          cx="118" 
          cy="220" 
          rx="10" 
          ry="28" 
          fill={getMuscleColor('hamstrings')}
          fillOpacity={getMuscleOpacity('hamstrings')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="82" y="225" textAnchor="middle" fontSize="5" fill="#FFF" fontWeight="bold">
          HAM
        </SvgText>
        <SvgText x="118" y="225" textAnchor="middle" fontSize="5" fill="#FFF" fontWeight="bold">
          HAM
        </SvgText>
      </G>

      {/* Calves - Interactive */}
      <G onPressIn={() => handleMusclePress('calves')} delayPressIn={0}>
        {/* Much larger invisible touch areas for easier clicking */}
        <Ellipse cx="85" cy="280" rx="22" ry="30" fill="transparent" />
        <Ellipse cx="115" cy="280" rx="22" ry="30" fill="transparent" />
        <Ellipse 
          cx="85" 
          cy="280" 
          rx="10" 
          ry="22" 
          fill={getMuscleColor('calves')}
          fillOpacity={getMuscleOpacity('calves')}
          stroke="#333"
          strokeWidth="2"
        />
        <Ellipse 
          cx="115" 
          cy="280" 
          rx="10" 
          ry="22" 
          fill={getMuscleColor('calves')}
          fillOpacity={getMuscleOpacity('calves')}
          stroke="#333"
          strokeWidth="2"
        />
        <SvgText x="85" y="285" textAnchor="middle" fontSize="5" fill="#FFF" fontWeight="bold">
          CALF
        </SvgText>
        <SvgText x="115" y="285" textAnchor="middle" fontSize="5" fill="#FFF" fontWeight="bold">
          CALF
        </SvgText>
      </G>
    </>
  );

  return (
    <View style={styles.container}>
      <Svg width={bodyWidth} height={bodyHeight} viewBox="0 0 200 330">
        <Defs>
          {/* Gradients for muscle depth */}
          <LinearGradient id="muscleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#FF6666" stopOpacity="0.9"/>
            <Stop offset="100%" stopColor="#FF2222" stopOpacity="0.7"/>
          </LinearGradient>
          
          <LinearGradient id="unworkedGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#6666FF" stopOpacity="0.5"/>
            <Stop offset="100%" stopColor="#2222FF" stopOpacity="0.3"/>
          </LinearGradient>
        </Defs>

        {/* Body outline - moved BEFORE muscle groups so it doesn't block touch events */}
        <Path
          d="M 100 48 
             Q 80 52 72 65 
             Q 62 75 57 95
             Q 52 115 57 135
             Q 62 155 72 175
             Q 77 195 85 215
             Q 90 255 85 275
             Q 85 295 90 315
             L 85 325
             L 95 325
             L 100 315
             L 105 325
             L 115 325
             L 115 315
             Q 115 295 115 275
             Q 110 255 115 215
             Q 123 195 128 175
             Q 138 155 143 135
             Q 148 115 143 95
             Q 138 75 128 65
             Q 120 52 100 48 Z"
          fill="none"
          stroke="#333"
          strokeWidth="2"
          pointerEvents="none"
        />

        {view === 'front' ? renderFrontView() : renderBackView()}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 
import EmojiConvertor from 'emoji-js';

const ANGEL = '0:)';
const ANGRY = '>:(';
const CHICKEN = '~:>';
const CRY = ':\'(';
const DEAD = 'X(';
const DEVIL = '>:)';
const DIZZY = ':S';
const EXCLAMATION = '!';
const FROWN = ':(';
const GRIN = ':D';
const HAPPY_TEARS = ':\')';
const HEART = '<3';
const HEART_BROKEN = '</3';
const KISS = ':-*';
const LAUGHING = 'XD';
const LEFT = '<-';
const MONEY_MOUTH = ':$';
const QUESTION = '?';
const RAISED_EYEBROW = '/:-|';
const RIGHT = '->';
const ROSE = '@};-';
const SALUTE = 'o7';
const SEALED = ':X';
const SHOCKED = 'D:';
const SLEEPING = '(-_-)zzz';
const SMILE = ':)';
const SMILING_EYES = '^_^';
const SMIRK = ':-J';
const STRAIGHT_FACE = ':|';
const SUNGLASSES = 'B)';
const SURPRISED = ':O';
const THINKING = 'hmm';
const THUMBSDOWN = '(n)';
const THUMBSUP = '(y)';
const TONGUE = ':P';
const TONGUE_WINK = ';P';
const UNAMUSED = '-_-';
const UNSURE = ':/';
const UPSIDE_DOWN_SMILE = ':^)';
const WAVE = 'o/';
const WEARY = 'DX';
const WINK = ';)';

const emoticonLookup: Record<string, string> = {
    '‼️': `${EXCLAMATION}${EXCLAMATION}`,
    '⁉️': `${EXCLAMATION}${QUESTION}`,
    '☹️': FROWN,
    '☺️': SMILING_EYES,
    '♥️': HEART,
    '❤️‍🔥': HEART,
    '➡️': RIGHT,
    '⬅️': LEFT,
    '❤️': HEART,
    '☠': DEAD,
    '❓': QUESTION,
    '❔': QUESTION,
    '❕': EXCLAMATION,
    '❗': EXCLAMATION,
    '🌹': ROSE,
    '🐓': CHICKEN,
    '🐔': CHICKEN,
    '👋': WAVE,
    '👍': THUMBSUP,
    '👎': THUMBSDOWN,
    '👿': ANGRY,
    '💀': DEAD,
    '💓': HEART,
    '💔': HEART_BROKEN,
    '💕': `${HEART}${HEART}`,
    '💖': HEART,
    '💗': HEART,
    '💘': HEART,
    '💙': HEART,
    '💚': HEART,
    '💛': HEART,
    '💜': HEART,
    '💟': HEART,
    '💢': ANGRY,
    '💤': SLEEPING,
    '🖖': SALUTE,
    '🖤': HEART,
    '😀': GRIN,
    '😁': SMILING_EYES,
    '😂': LAUGHING,
    '😃': GRIN,
    '😄': SMILING_EYES,
    '😆': LAUGHING,
    '😇': ANGEL,
    '😈': DEVIL,
    '😉': WINK,
    '😊': SMILING_EYES,
    '😋': TONGUE,
    '😌': SMILE,
    '😎': SUNGLASSES,
    '😏': SMIRK,
    '😐': STRAIGHT_FACE,
    '😑': UNAMUSED,
    '😒': UNSURE,
    '😓': FROWN,
    '😔': FROWN,
    '😕': UNSURE,
    '😖': DEAD,
    '😗': KISS,
    '😘': KISS,
    '😙': KISS,
    '😚': KISS,
    '😛': TONGUE,
    '😜': TONGUE_WINK,
    '😝': TONGUE_WINK,
    '😞': FROWN,
    '😟': FROWN,
    '😠': ANGRY,
    '😡': ANGRY,
    '😢': CRY,
    '😣': DEAD,
    '😥': FROWN,
    '😦': FROWN,
    '😧': SHOCKED,
    '😨': SHOCKED,
    '😩': WEARY,
    '😪': SLEEPING,
    '😫': WEARY,
    '😭': CRY,
    '😮': SURPRISED,
    '😮‍💨': FROWN,
    '😯': SURPRISED,
    '😰': SHOCKED,
    '😱': SHOCKED,
    '😲': SURPRISED,
    '😴': SLEEPING,
    '😵': DEAD,
    '😵‍💫': DIZZY,
    '🙁': FROWN,
    '🙂': SMILE,
    '🙃': UPSIDE_DOWN_SMILE,
    '🙄': UNSURE,
    '🙊': SEALED,
    '🤍': HEART,
    '🤎': HEART,
    '🤐': SEALED,
    '🤑': MONEY_MOUTH,
    '🤔': THINKING,
    '🤣': LAUGHING,
    '🤨': RAISED_EYEBROW,
    '🤪': TONGUE_WINK,
    '🤬': ANGRY,
    '🤯': SURPRISED,
    '🥱': SLEEPING,
    '🥲': HAPPY_TEARS,
    '🥴': DIZZY,
    '🥹': HAPPY_TEARS,
    '🧡': HEART,
    '🫀': HEART,
    '🫠': UPSIDE_DOWN_SMILE,
    '🫡': SALUTE,
    '🫤': UNSURE,
    '🏻': '',
    '🏼': '',
    '🏽': '',
    '🏾': '',
    '🏿': ''
}

const emoji = new EmojiConvertor();
emoji.colons_mode = true;
const re = new RegExp(Object.keys(emoticonLookup).join('|'), 'g');

export class Emoji {
    emojiToText(str: string): string {
        try {
            return emoji.replace_unified(str.replace(re, emoji => emoticonLookup[emoji] || emoji));
        }
        catch (ex) {
            console.error(`ERROR: Problem stripping emoji from "${str}"`, ex);
            return str;
        }
    }

    textToEmoji(str: string): string {
        return emoji.replace_colons(str);
    }
}

export default Emoji;
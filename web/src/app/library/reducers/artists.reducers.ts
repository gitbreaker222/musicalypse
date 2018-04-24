import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {Artist} from '@app/model';
import {ArtistsActionsUnion, ArtistsActionTypes} from '@app/library/actions/artists.actions';
import {TracksActionsUnion, TracksActionTypes} from '@app/library/actions/tracks.actions';

/**
 * State
 */
export interface State extends EntityState<Artist> {
  selectedIds: (string | number)[];
}

export const adapter: EntityAdapter<Artist> = createEntityAdapter<Artist>({
  selectId: (artist: Artist) => artist.name,
  sortComparer: (a, b) => a.name.localeCompare(b.name),
});

export const initialState: State = adapter.getInitialState({
  selectedIds: []
});

/**
 * Reducer
 */
export function reducer(
  state = initialState,
  action: ArtistsActionsUnion | TracksActionsUnion
): State {
  switch (action.type) {

    case ArtistsActionTypes.LoadArtists:
      return adapter.upsertMany(action.payload, state);

    case ArtistsActionTypes.SelectAllArtists: {
      return {
        ...state,
        selectedIds: state.ids
      };
    }

    case ArtistsActionTypes.DeselectAllArtists: {
      return {
        ...state,
        selectedIds: []
      };
    }

    case ArtistsActionTypes.SelectArtist: {
      if (state.selectedIds.indexOf(action.payload.name) === -1) {
        return {
          ...state,
          selectedIds: [...state.selectedIds, action.payload.name]
        };
      } else {
        return state;
      }
    }

    case ArtistsActionTypes.DeselectArtist: {
      return {
        ...state,
        selectedIds: state.selectedIds.filter(id => id !== action.payload.name)
      };
    }

    case ArtistsActionTypes.SelectArtists: {
      return {
        ...state,
        selectedIds: action.payload.map(a => a.name)
      };
    }

    case ArtistsActionTypes.SelectArtistsByIds: {
      return {
        ...state,
        selectedIds: action.payload
      };
    }

    case TracksActionTypes.ScanTracks:
      return adapter.removeAll({
        ...state,
        selectedIds: []
      });

    default: {
      return state;
    }
  }
}

/**
 * Selectors
 */
export const getSelectedIds = (state: State) => state.selectedIds;